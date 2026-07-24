import { Decimal } from "decimal.js";
import type { LoanEngineInput } from "./types";

export function baseInput(
  overrides: Partial<LoanEngineInput> = {},
): LoanEngineInput {
  return {
    sanctionDate: new Date("2024-01-01"),
    interestRatePercent: new Decimal(12),
    calculationMethod: "REDUCING_BALANCE",
    compounding: "MONTHLY",
    dayCountConvention: "DAYS_365",
    paymentFrequency: "MONTHLY",
    prepaymentStrategy: "REDUCE_TENURE",
    emiType: "STANDARD",
    loanTenureMonths: 12,
    repaymentTenureMonths: 12,
    emiStartDate: new Date("2024-02-01"),
    hasMoratorium: false,
    moratoriumStartDate: null,
    moratoriumEndDate: null,
    moratoriumInterestPayment: "NONE",
    moratoriumAvgMonthlyInterest: null,
    capitalizeUnpaidInterest: true,
    status: "NOT_STARTED",
    disbursements: [{ date: new Date("2024-01-01"), amount: new Decimal(120000) }],
    payments: [],
    importSnapshot: null,
    ...overrides,
  };
}
