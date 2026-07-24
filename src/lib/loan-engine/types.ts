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

/** One explained step of a period's calculation — the formula with real
 * numbers substituted, a plain-English one-liner, and the numeric result,
 * so the UI only ever renders this, never recomputes it. */
export interface CalculationStep {
  key: string;
  formula: string;
  explanation: string;
  value: Money;
}

export interface CalculationBreakdown {
  openingBalance: CalculationStep;
  rateApplied: CalculationStep;
  daysCounted: CalculationStep;
  interestAccrual: CalculationStep;
  capitalization?: CalculationStep;
  emiSizing: CalculationStep;
  paymentApplication: CalculationStep;
  closingBalance: CalculationStep;
}

export interface ScheduleEntry {
  monthIndex: number;
  dueDate: Date;
  /** Which phase generated this entry — moratorium periods legitimately
   * grow the balance by design (unpaid interest capitalizing), which is
   * not the same thing as negative amortization in the EMI phase. */
  phase: "MORATORIUM" | "EMI";
  openingBalance: Money;
  interestAccrued: Money;
  interestPaid: Money;
  principalPaid: Money;
  emiAmount: Money;
  extraPayment: Money;
  capitalizedInterest: Money;
  closingBalance: Money;
  status: AmortizationStatus;
  /** Date of the latest recorded payment applied within this period, if any. */
  paymentDate: Date | null;
  /** Days between the due date and the payment date — positive means late,
   * null when there's no recorded payment to compare against. */
  daysLate: number | null;
  breakdown: CalculationBreakdown;
}

export interface ValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
}

/** Schedule-*output* validation — distinct from ValidationIssue, which only
 * checks inputs before generation ever runs. */
export interface ScheduleAnomaly {
  code: string;
  severity: "error" | "warning" | "info";
  monthIndex: number | null;
  message: string;
}

export interface BalanceAuditChainLink {
  monthIndex: number;
  openingBalance: Money;
  interestPosted: Money;
  capitalized: Money;
  regularPayment: Money;
  extraPayment: Money;
  closingBalance: Money;
  /** closingBalance recomputed independently from the deltas above, as a
   * reconciliation sanity check — should always be true. */
  reconciles: boolean;
}

export type ClosureReason = "NATURAL_MATURITY" | "FORECLOSURE";

export interface GenerateScheduleResult {
  entries: ScheduleEntry[];
  warnings: ValidationIssue[];
  anomalies: ScheduleAnomaly[];
  converged: boolean;
  closureReason: ClosureReason | null;
}
