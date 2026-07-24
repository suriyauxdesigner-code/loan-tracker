import type { Decimal } from "decimal.js";

export type Money = Decimal;

export type DayCountConvention = "DAYS_365" | "DAYS_360";
export type CompoundingFrequency = "DAILY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type InterestCalculationMethod =
  | "SIMPLE"
  | "COMPOUND"
  | "REDUCING_BALANCE";
export type MoratoriumInterestPayment = "NONE" | "FULL" | "PARTIAL";
export type EmiType = "STANDARD" | "INTEREST_ONLY" | "FLEXIBLE";
export type PaymentFrequency = "MONTHLY" | "QUARTERLY" | "WEEKLY" | "BIWEEKLY";
export type PrepaymentStrategy = "REDUCE_TENURE" | "REDUCE_EMI";
export type LoanStatus =
  | "NOT_STARTED"
  | "STUDY_PERIOD"
  | "MORATORIUM"
  | "EMI_STARTED"
  | "CLOSED";
export type AmortizationStatus =
  | "PAID"
  | "PARTIAL"
  | "EXTRA_PAID"
  | "PENDING"
  | "MISSED"
  | "UPCOMING";
export type PaymentType =
  | "EMI"
  | "EXTRA"
  | "INTEREST_ONLY"
  | "PRINCIPAL_ONLY"
  | "LUMP_SUM";

export interface DisbursementInput {
  date: Date;
  amount: Money;
}

export interface PaymentInput {
  date: Date;
  amount: Money;
  type: PaymentType;
  interestPaid?: Money | null;
  principalPaid?: Money | null;
}

export interface ImportSnapshotInput {
  asOfDate: Date;
  outstandingPrincipal: Money;
  accruedInterest: Money;
}

export interface LoanEngineInput {
  sanctionDate: Date;
  interestRatePercent: Money;
  calculationMethod: InterestCalculationMethod;
  compounding: CompoundingFrequency;
  dayCountConvention: DayCountConvention;
  paymentFrequency: PaymentFrequency;
  prepaymentStrategy: PrepaymentStrategy;
  emiType: EmiType;
  loanTenureMonths: number;
  repaymentTenureMonths: number;
  emiStartDate: Date | null;

  hasMoratorium: boolean;
  moratoriumStartDate: Date | null;
  moratoriumEndDate: Date | null;
  moratoriumInterestPayment: MoratoriumInterestPayment;
  moratoriumAvgMonthlyInterest: Money | null;
  capitalizeUnpaidInterest: boolean;

  status: LoanStatus;

  disbursements: DisbursementInput[];
  payments: PaymentInput[];
  importSnapshot: ImportSnapshotInput | null;
}

export interface ScheduleEntry {
  monthIndex: number;
  dueDate: Date;
  openingBalance: Money;
  interestAccrued: Money;
  interestPaid: Money;
  principalPaid: Money;
  emiAmount: Money;
  extraPayment: Money;
  capitalizedInterest: Money;
  closingBalance: Money;
  status: AmortizationStatus;
}

export interface ValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
}

export interface GenerateScheduleResult {
  entries: ScheduleEntry[];
  warnings: ValidationIssue[];
  converged: boolean;
}
