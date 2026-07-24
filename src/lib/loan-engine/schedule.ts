import { Decimal } from "decimal.js";
import type {
  AmortizationStatus,
  CalculationBreakdown,
  ClosureReason,
  GenerateScheduleResult,
  LoanEngineInput,
  PaymentInput,
  ScheduleEntry,
} from "./types";
import { addMonthsAnchored, daysBetween, monthsBetween } from "./date-utils";
import { accrueForMethod, installmentRate } from "./interest";
import {
  computeAnnuityEmi,
  computeFinalPeriodPayment,
  computeFlatEmi,
  computeInterestOnlyEmi,
} from "./emi";
import {
  computeMoratoriumPeriod,
  isCapitalizationBoundary,
  lumpSumCapitalizeAtMoratoriumEnd,
} from "./moratorium";
import { buildDisbursementTimeline, disbursementDatesWithin } from "./disbursement";
import { buildSeedState } from "./import-seed";
import { validateLoanInputs } from "./validate";
import { auditSchedule } from "./audit";
import {
  explainCapitalization,
  explainClosingBalance,
  explainEmiSizing,
  explainInterestAccrual,
  explainOpeningBalance,
  explainPaymentApplication,
  explainRateApplied,
} from "./explain";

const SAFETY_MARGIN_MONTHS = 24;
const ZERO_THRESHOLD = new Decimal("0.01");

function periodsPerYear(frequency: LoanEngineInput["paymentFrequency"]): number {
  switch (frequency) {
    case "MONTHLY":
      return 12;
    case "QUARTERLY":
      return 4;
    case "WEEKLY":
      return 52;
    case "BIWEEKLY":
      return 26;
  }
}

function paymentsInWindow(
  payments: PaymentInput[],
  periodStart: Date,
  periodEnd: Date,
): PaymentInput[] {
  return payments.filter((p) => p.date > periodStart && p.date <= periodEnd);
}

function latestPaymentDate(payments: PaymentInput[]): Date | null {
  if (payments.length === 0) return null;
  return payments.reduce((latest, p) => (p.date > latest ? p.date : latest), payments[0].date);
}

function computeStatus(
  dueDate: Date,
  today: Date,
  amountDue: Decimal,
  amountPaid: Decimal,
): AmortizationStatus {
  if (amountDue.lessThanOrEqualTo(0)) {
    return dueDate > today ? "UPCOMING" : "PAID";
  }
  if (amountPaid.isZero()) {
    if (dueDate > today) return "UPCOMING";
    if (daysBetween(today, dueDate) === 0) return "PENDING";
    return "MISSED";
  }
  if (amountPaid.greaterThan(amountDue)) return "EXTRA_PAID";
  if (amountPaid.greaterThanOrEqualTo(amountDue)) return "PAID";
  return "PARTIAL";
}

/** Applies payments recorded within a period to interest-first-then-principal,
 * unless a payment already specifies its own split. */
function applyPayments(
  payments: PaymentInput[],
  interestAccrued: Decimal,
): { interestPaid: Decimal; principalPaid: Decimal; extraPayment: Decimal } {
  let interestPaid = new Decimal(0);
  let principalPaid = new Decimal(0);
  let extraPayment = new Decimal(0);

  for (const p of payments) {
    if (p.interestPaid != null || p.principalPaid != null) {
      interestPaid = interestPaid.plus(p.interestPaid ?? new Decimal(0));
      principalPaid = principalPaid.plus(p.principalPaid ?? new Decimal(0));
    } else {
      const remainingInterestDue = Decimal.max(
        0,
        interestAccrued.minus(interestPaid),
      );
      const towardInterest = Decimal.min(p.amount, remainingInterestDue);
      const towardPrincipal = p.amount.minus(towardInterest);
      interestPaid = interestPaid.plus(towardInterest);
      principalPaid = principalPaid.plus(towardPrincipal);
    }
    if (p.type === "EXTRA" || p.type === "LUMP_SUM") {
      extraPayment = extraPayment.plus(p.amount);
    }
  }

  return { interestPaid, principalPaid, extraPayment };
}

function sizeEmi(
  input: LoanEngineInput,
  balance: Decimal,
  periodicRate: Decimal,
  remainingPeriods: number,
): Decimal {
  return input.calculationMethod === "SIMPLE"
    ? computeFlatEmi(balance, periodicRate, remainingPeriods)
    : computeAnnuityEmi(balance, periodicRate, remainingPeriods);
}

export function generateSchedule(
  input: LoanEngineInput,
  today: Date = new Date(),
): GenerateScheduleResult {
  const warnings = validateLoanInputs(input);
  if (warnings.some((w) => w.severity === "error")) {
    return {
      entries: [],
      warnings,
      anomalies: [],
      converged: false,
      closureReason: null,
    };
  }

  const entries: ScheduleEntry[] = [];
  const disbursementTimeline = buildDisbursementTimeline(input.disbursements);
  const cadenceAnchor = input.emiStartDate ?? input.sanctionDate;

  const moratoriumEnd =
    input.hasMoratorium && input.moratoriumEndDate
      ? input.emiStartDate && input.emiStartDate < input.moratoriumEndDate
        ? input.emiStartDate
        : input.moratoriumEndDate
      : null;

  let entryIndex = 0;
  let cursorDate: Date;
  let openingBalance: Decimal;
  let startPhase: "MORATORIUM" | "EMI";
  let firstPeriodEndOverride: Date | null = null;
  let openingBalanceSource: "disbursement" | "prior-closing" | "import-snapshot" =
    "disbursement";

  if (input.importSnapshot) {
    const seed = buildSeedState(
      input.importSnapshot.asOfDate,
      input.status,
      cadenceAnchor,
    );
    cursorDate = input.importSnapshot.asOfDate;
    openingBalance = input.importSnapshot.outstandingPrincipal.plus(
      input.importSnapshot.accruedInterest,
    );
    startPhase = seed.resumeFromPhase;
    firstPeriodEndOverride = seed.nextAlignedDueDate;
    openingBalanceSource = "import-snapshot";
  } else {
    cursorDate =
      input.disbursements.length > 0
        ? input.disbursements.reduce(
            (min, d) => (d.date < min ? d.date : min),
            input.disbursements[0].date,
          )
        : input.sanctionDate;
    openingBalance = new Decimal(0);
    startPhase = input.hasMoratorium && moratoriumEnd ? "MORATORIUM" : "EMI";
  }

  const safetyCap =
    input.loanTenureMonths +
    input.repaymentTenureMonths +
    SAFETY_MARGIN_MONTHS;

  // ---- MORATORIUM PHASE ----
  let carriedShortfall = new Decimal(0);
  let moratoriumPeriodIndex = 0;
  if (startPhase === "MORATORIUM" && moratoriumEnd) {
    let periodStart = cursorDate;
    while (periodStart < moratoriumEnd && entryIndex < safetyCap) {
      let periodEnd =
        firstPeriodEndOverride ??
        addMonthsAnchored(
          cadenceAnchor,
          monthsBetween(cadenceAnchor, periodStart) + 1,
        );
      if (periodEnd > moratoriumEnd) periodEnd = moratoriumEnd;
      firstPeriodEndOverride = null;
      if (periodEnd.getTime() === periodStart.getTime()) break;

      const currentBalance = input.importSnapshot
        ? openingBalance
        : disbursementTimeline(periodStart);
      const changePoints = input.importSnapshot
        ? []
        : disbursementDatesWithin(input.disbursements, periodStart, periodEnd);

      // Date-weighted: splits at any mid-period disbursement instead of
      // assuming a flat balance for the whole period.
      const interestAccrued = accrueForMethod(
        input.calculationMethod,
        periodStart,
        periodEnd,
        input.interestRatePercent,
        input.dayCountConvention,
        input.compounding,
        (asOf) => (input.importSnapshot ? currentBalance : disbursementTimeline(asOf)),
        changePoints,
      );

      moratoriumPeriodIndex++;
      const capitalizeThisBoundary =
        input.capitalizeUnpaidInterest &&
        isCapitalizationBoundary(input.compounding, moratoriumPeriodIndex);

      const result = computeMoratoriumPeriod({
        openingBalance: currentBalance,
        interestAccrued,
        paymentPolicy: input.moratoriumInterestPayment,
        avgMonthlyPayment: input.moratoriumAvgMonthlyInterest,
        capitalizeEachPeriod: capitalizeThisBoundary,
        carriedShortfall,
      });
      carriedShortfall = result.carriedShortfall;

      const periodPayments = paymentsInWindow(input.payments, periodStart, periodEnd);
      const { interestPaid: actualInterestPaid } = applyPayments(
        periodPayments,
        interestAccrued,
      );
      const interestPaid = actualInterestPaid.greaterThan(0)
        ? actualInterestPaid
        : result.interestPaid;
      const amountDue =
        input.moratoriumInterestPayment === "NONE"
          ? new Decimal(0)
          : interestAccrued;

      entryIndex++;
      const breakdown: CalculationBreakdown = {
        openingBalance: explainOpeningBalance(currentBalance, openingBalanceSource),
        rateApplied: explainRateApplied(input.interestRatePercent),
        interestAccrual: explainInterestAccrual(
          input.calculationMethod,
          currentBalance,
          input.interestRatePercent,
          daysBetween(periodStart, periodEnd),
          input.dayCountConvention,
          interestAccrued,
        ),
        capitalization: result.capitalizedThisPeriod.greaterThan(0)
          ? explainCapitalization(result.capitalizedThisPeriod, result.closingBalance)
          : undefined,
        emiSizing: {
          key: "emiSizing",
          formula: amountDue.isZero() ? "No payment due this period" : amountDue.toFixed(2),
          explanation:
            input.moratoriumInterestPayment === "NONE"
              ? "No interest payment is expected during the moratorium under the selected policy."
              : input.moratoriumInterestPayment === "FULL"
                ? "Full monthly interest is expected to be paid during the moratorium."
                : "A fixed partial interest amount is expected to be paid during the moratorium.",
          value: amountDue,
        },
        paymentApplication: explainPaymentApplication(interestPaid, new Decimal(0), interestAccrued),
        closingBalance: explainClosingBalance(
          currentBalance,
          new Decimal(0),
          result.capitalizedThisPeriod,
          result.closingBalance,
        ),
      };

      entries.push({
        monthIndex: entryIndex,
        dueDate: periodEnd,
        phase: "MORATORIUM",
        openingBalance: currentBalance,
        interestAccrued,
        interestPaid,
        principalPaid: new Decimal(0),
        emiAmount: amountDue,
        extraPayment: new Decimal(0),
        capitalizedInterest: result.capitalizedThisPeriod,
        closingBalance: result.closingBalance,
        status: computeStatus(periodEnd, today, amountDue, interestPaid),
        paymentDate: latestPaymentDate(periodPayments),
        daysLate: periodPayments.length > 0 ? daysBetween(periodEnd, latestPaymentDate(periodPayments)!) : null,
        breakdown,
      });

      openingBalance = result.closingBalance;
      openingBalanceSource = "prior-closing";
      periodStart = periodEnd;
    }

    if (carriedShortfall.greaterThan(0)) {
      // Leftover shortfall that hasn't hit a capitalization boundary yet
      // (or, when capitalizeUnpaidInterest is false, the entire
      // moratorium's shortfall) gets folded in once, uncompounded, here.
      openingBalance = lumpSumCapitalizeAtMoratoriumEnd(
        carriedShortfall,
        openingBalance,
      );
      const last = entries[entries.length - 1];
      if (last) {
        last.capitalizedInterest = last.capitalizedInterest.plus(carriedShortfall);
        last.closingBalance = openingBalance;
      }
    }

    cursorDate = moratoriumEnd;
  }

  if (startPhase === "EMI" && !input.importSnapshot) {
    openingBalance = disbursementTimeline(cursorDate);
  }

  // ---- EMI PHASE ----
  const periodicRate = installmentRate(
    input.interestRatePercent,
    periodsPerYear(input.paymentFrequency),
  );

  let fixedEmi: Decimal | null = null;
  if (input.emiType !== "INTEREST_ONLY") {
    fixedEmi = sizeEmi(input, openingBalance, periodicRate, input.repaymentTenureMonths);
  }

  let periodStart = cursorDate;
  let periodsElapsedInEmiPhase = 0;

  while (
    openingBalance.greaterThan(ZERO_THRESHOLD) &&
    entryIndex < safetyCap &&
    periodsElapsedInEmiPhase < input.repaymentTenureMonths + SAFETY_MARGIN_MONTHS
  ) {
    const periodEnd = addMonthsAnchored(
      cadenceAnchor,
      monthsBetween(cadenceAnchor, periodStart) + 1,
    );
    // Interest accrues on the actual amortizing balance for this period —
    // NOT on the flat cumulative-disbursed total, which never shrinks as
    // principal gets paid down. changePoints only matter for the rare case
    // of a fresh disbursement landing mid-EMI-phase (e.g. a top-up loan),
    // added on top of the amortizing balance rather than replacing it.
    const changePoints = input.importSnapshot
      ? []
      : disbursementDatesWithin(input.disbursements, periodStart, periodEnd);
    const balanceAtStart = openingBalance;
    const interestAccrued = accrueForMethod(
      input.calculationMethod,
      periodStart,
      periodEnd,
      input.interestRatePercent,
      input.dayCountConvention,
      input.compounding,
      (asOf) =>
        input.importSnapshot
          ? balanceAtStart
          : balanceAtStart.plus(
              disbursementTimeline(asOf).minus(disbursementTimeline(periodStart)),
            ),
      changePoints,
    );

    let plannedEmi: Decimal;
    if (input.emiType === "INTEREST_ONLY") {
      plannedEmi = computeInterestOnlyEmi(interestAccrued);
    } else {
      plannedEmi =
        fixedEmi ??
        sizeEmi(
          input,
          openingBalance,
          periodicRate,
          input.repaymentTenureMonths - periodsElapsedInEmiPhase,
        );
    }

    const plannedPrincipal = Decimal.max(0, plannedEmi.minus(interestAccrued));
    const isLastScheduledPeriod =
      periodsElapsedInEmiPhase >= input.repaymentTenureMonths - 1;
    const isFinalPeriod =
      input.emiType === "INTEREST_ONLY"
        ? isLastScheduledPeriod
        : plannedPrincipal.greaterThanOrEqualTo(openingBalance);
    if (isFinalPeriod) {
      plannedEmi = computeFinalPeriodPayment(openingBalance, interestAccrued);
    }

    const periodPayments = paymentsInWindow(input.payments, periodStart, periodEnd);
    let interestPaid: Decimal;
    let principalPaid: Decimal;
    let extraPayment = new Decimal(0);
    let hasActualPayment = false;
    let closingBalance: Decimal;
    let capitalizedThisPeriod = new Decimal(0);

    if (periodPayments.length > 0) {
      const applied = applyPayments(periodPayments, interestAccrued);
      interestPaid = applied.interestPaid;
      principalPaid = applied.principalPaid;
      extraPayment = applied.extraPayment;
      hasActualPayment = true;
      closingBalance = Decimal.max(0, openingBalance.minus(principalPaid));
    } else if (periodEnd > today) {
      // Genuine future projection — an amortization table assumes the
      // planned installment gets paid on time; Payment Tracker (a later
      // phase) reconciles real payments as they happen.
      interestPaid = interestAccrued;
      principalPaid = Decimal.max(0, plannedEmi.minus(interestAccrued));
      closingBalance = Decimal.max(0, openingBalance.minus(principalPaid));
    } else {
      // Past due date, nothing recorded — genuinely missed. Real banks
      // don't treat this as paid: principal isn't reduced, and the unpaid
      // interest is rolled into what's owed (capitalized) rather than
      // silently vanishing.
      interestPaid = new Decimal(0);
      principalPaid = new Decimal(0);
      closingBalance = openingBalance.plus(interestAccrued);
      capitalizedThisPeriod = interestAccrued;
    }

    const totalPaid = interestPaid.plus(principalPaid);

    entryIndex++;
    periodsElapsedInEmiPhase++;
    const breakdown: CalculationBreakdown = {
      openingBalance: explainOpeningBalance(openingBalance, openingBalanceSource),
      rateApplied: explainRateApplied(input.interestRatePercent),
      interestAccrual: explainInterestAccrual(
        input.calculationMethod,
        openingBalance,
        input.interestRatePercent,
        daysBetween(periodStart, periodEnd),
        input.dayCountConvention,
        interestAccrued,
      ),
      capitalization: capitalizedThisPeriod.greaterThan(0)
        ? explainCapitalization(capitalizedThisPeriod, closingBalance)
        : undefined,
      emiSizing: explainEmiSizing(input.emiType, input.calculationMethod, isFinalPeriod, plannedEmi),
      paymentApplication: explainPaymentApplication(interestPaid, principalPaid, interestAccrued),
      closingBalance: explainClosingBalance(
        openingBalance,
        principalPaid,
        capitalizedThisPeriod,
        closingBalance,
      ),
    };

    entries.push({
      monthIndex: entryIndex,
      dueDate: periodEnd,
      phase: "EMI",
      openingBalance,
      interestAccrued,
      interestPaid,
      principalPaid,
      emiAmount: plannedEmi,
      extraPayment,
      capitalizedInterest: capitalizedThisPeriod,
      closingBalance,
      status: hasActualPayment
        ? computeStatus(periodEnd, today, plannedEmi, totalPaid)
        : periodEnd > today
          ? "UPCOMING"
          : "MISSED",
      paymentDate: hasActualPayment ? latestPaymentDate(periodPayments) : null,
      daysLate: hasActualPayment
        ? daysBetween(periodEnd, latestPaymentDate(periodPayments)!)
        : null,
      breakdown,
    });

    if (
      extraPayment.greaterThan(0) &&
      input.emiType !== "INTEREST_ONLY" &&
      input.prepaymentStrategy === "REDUCE_EMI"
    ) {
      fixedEmi = sizeEmi(
        input,
        closingBalance,
        periodicRate,
        Math.max(1, input.repaymentTenureMonths - periodsElapsedInEmiPhase),
      );
    }

    openingBalance = closingBalance;
    openingBalanceSource = "prior-closing";
    periodStart = periodEnd;
  }

  const converged = openingBalance.lessThanOrEqualTo(ZERO_THRESHOLD);

  let closureReason: ClosureReason | null = null;
  if (converged) {
    const hadExtraPayment = entries.some((e) => e.extraPayment.greaterThan(0));
    closureReason =
      hadExtraPayment && periodsElapsedInEmiPhase < input.repaymentTenureMonths
        ? "FORECLOSURE"
        : "NATURAL_MATURITY";
  }

  const anomalies = auditSchedule(entries, input, converged);

  return { entries, warnings, anomalies, converged, closureReason };
}
