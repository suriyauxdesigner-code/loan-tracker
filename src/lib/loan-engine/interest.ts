import { Decimal } from "decimal.js";
import type {
  CompoundingFrequency,
  DayCountConvention,
  InterestCalculationMethod,
} from "./types";
import { daysBetween, dayCountFraction } from "./date-utils";

/** Rate used only to size the EMI figure via the annuity formula — always
 * a flat annual/periodsPerYear split, never day-count adjusted. */
export function installmentRate(
  annualRatePercent: Decimal,
  periodsPerYear: number,
): Decimal {
  return annualRatePercent.dividedBy(100).dividedBy(periodsPerYear);
}

/** Day-count-based simple interest for a single sub-interval on a fixed
 * balance — the rate actually booked on AmortizationEntry.interestAccrued. */
export function accrueSimpleInterest(
  balance: Decimal,
  annualRatePercent: Decimal,
  days: number,
  convention: DayCountConvention,
): Decimal {
  if (days <= 0) return new Decimal(0);
  return balance
    .times(annualRatePercent.dividedBy(100))
    .times(dayCountFraction(days, convention));
}

/** Splits [start, end] at each date in `changePoints` that falls strictly
 * inside the range (e.g. a mid-period disbursement), applying `balanceAt`
 * for each sub-interval and summing interest. Required for correctness
 * whenever the balance isn't flat for the whole period. */
export function accruePeriodInterest(
  start: Date,
  end: Date,
  annualRatePercent: Decimal,
  convention: DayCountConvention,
  balanceAt: (date: Date) => Decimal,
  changePoints: Date[] = [],
): Decimal {
  const boundaries = [
    start,
    ...changePoints.filter((d) => d > start && d < end),
    end,
  ].sort((a, b) => a.getTime() - b.getTime());

  let total = new Decimal(0);
  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    const days = daysBetween(segStart, segEnd);
    if (days <= 0) continue;
    total = total.plus(
      accrueSimpleInterest(balanceAt(segStart), annualRatePercent, days, convention),
    );
  }
  return total;
}

const SUB_PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  DAILY: 365,
  MONTHLY: 12,
  QUARTERLY: 4,
  YEARLY: 1,
};

/** COMPOUND method: reducing-balance with intra-period sub-compounding at
 * the configured frequency — not a closed-form P(1+r/n)^nt, which has no
 * coherent meaning once monthly EMI payments interrupt it. */
export function accrueCompoundInterest(
  openingBalance: Decimal,
  annualRatePercent: Decimal,
  start: Date,
  end: Date,
  compounding: CompoundingFrequency,
  convention: DayCountConvention,
): Decimal {
  const totalDays = daysBetween(start, end);
  if (totalDays <= 0) return new Decimal(0);

  const subPeriodsPerYear = SUB_PERIODS_PER_YEAR[compounding];
  const subPeriodDays = Math.max(1, Math.round(365 / subPeriodsPerYear));

  let balance = openingBalance;
  let remainingDays = totalDays;
  while (remainingDays > 0) {
    const days = Math.min(subPeriodDays, remainingDays);
    balance = balance.plus(
      accrueSimpleInterest(balance, annualRatePercent, days, convention),
    );
    remainingDays -= days;
  }
  return balance.minus(openingBalance);
}

/** Routes accrual through the correct formula for `calculationMethod`.
 * REDUCING_BALANCE and SIMPLE both accrue as day-count simple interest
 * (their difference is in how the *principal base* moves over time, not
 * in this per-period accrual step) and stay change-point aware (mid-period
 * disbursements); COMPOUND sub-compounds at `compounding` frequency and,
 * because that's a genuinely different balance-growth model, doesn't
 * support mid-period change points — it accrues on the balance as of the
 * period's start. */
export function accrueForMethod(
  method: InterestCalculationMethod,
  start: Date,
  end: Date,
  annualRatePercent: Decimal,
  convention: DayCountConvention,
  compounding: CompoundingFrequency,
  balanceAt: (date: Date) => Decimal,
  changePoints: Date[] = [],
): Decimal {
  if (method === "COMPOUND") {
    return accrueCompoundInterest(
      balanceAt(start),
      annualRatePercent,
      start,
      end,
      compounding,
      convention,
    );
  }
  return accruePeriodInterest(
    start,
    end,
    annualRatePercent,
    convention,
    balanceAt,
    changePoints,
  );
}
