import { Decimal } from "decimal.js";
import { LoanType } from "@/generated/prisma/enums";
import type { LoanEngineInput } from "@/lib/loan-engine";
import type { LoanSetupValues } from "./schema";

function toDate(value: string | undefined): Date | null {
  return value ? new Date(value) : null;
}

function toDecimal(value: string | undefined): Decimal {
  return new Decimal(value || "0");
}

/** Maps the wizard's raw (string-based) form values into the engine's
 * typed input — used client-side by the Review step to preview validation
 * warnings before submission. Mirrors the implicit-disbursement rule the
 * Server Action applies for Personal loans (no Disbursement step). */
export function mapFormToEngineInput(values: LoanSetupValues): LoanEngineInput {
  const disbursements = values.disbursements
    .filter((d) => d.date && d.amount)
    .map((d) => ({ date: new Date(d.date), amount: toDecimal(d.amount) }));

  if (
    disbursements.length === 0 &&
    values.loanType === LoanType.PERSONAL &&
    values.sanctionDate &&
    values.principalAmount
  ) {
    disbursements.push({
      date: new Date(values.sanctionDate),
      amount: toDecimal(values.principalAmount),
    });
  }

  return {
    sanctionDate: toDate(values.sanctionDate) ?? new Date(),
    interestRatePercent: toDecimal(values.interestRate),
    calculationMethod: "REDUCING_BALANCE",
    compounding: "MONTHLY",
    dayCountConvention: "DAYS_365",
    paymentFrequency: "MONTHLY",
    prepaymentStrategy: "REDUCE_TENURE",
    emiType: values.emiType,
    loanTenureMonths: Number(values.loanTenureMonths) || 0,
    repaymentTenureMonths: Number(values.repaymentTenureMonths) || 0,
    emiStartDate: toDate(values.emiStartDate),

    hasMoratorium: values.hasMoratorium,
    moratoriumStartDate: toDate(values.moratoriumStartDate),
    moratoriumEndDate: toDate(values.moratoriumEndDate),
    moratoriumInterestPayment: values.moratoriumInterestPayment,
    moratoriumAvgMonthlyInterest: values.moratoriumAvgMonthlyInterest
      ? toDecimal(values.moratoriumAvgMonthlyInterest)
      : null,
    capitalizeUnpaidInterest: values.capitalizeUnpaidInterest,

    status: values.status,

    disbursements,
    payments: values.existingPayments
      .filter((p) => p.date && p.amount)
      .map((p) => ({
        date: new Date(p.date),
        amount: toDecimal(p.amount),
        type: p.type,
        interestPaid: p.interestPaid ? toDecimal(p.interestPaid) : null,
        principalPaid: p.principalPaid ? toDecimal(p.principalPaid) : null,
      })),
    importSnapshot:
      values.isExistingLoan && values.outstandingPrincipal
        ? {
            asOfDate: toDate(values.lastInterestPostingDate) ?? new Date(),
            outstandingPrincipal: toDecimal(values.outstandingPrincipal),
            accruedInterest: toDecimal(values.accruedInterest),
          }
        : null,
  };
}
