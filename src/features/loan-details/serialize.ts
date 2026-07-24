import type {
  BalanceAuditChainLink,
  CalculationBreakdown,
  CalculationStep,
  ScheduleAnomaly,
  ScheduleEntry,
} from "@/lib/loan-engine";

/** Decimal/Date instances aren't serializable across the Server->Client
 * Component boundary — this converts engine output to plain JSON-safe
 * shapes for the interactive schedule table / drawer. Purely a transport
 * concern, no calculation happens here. */

export interface SerializedStep {
  key: string;
  formula: string;
  explanation: string;
  value: string;
}

export interface SerializedBreakdown {
  openingBalance: SerializedStep;
  rateApplied: SerializedStep;
  daysCounted: SerializedStep;
  interestAccrual: SerializedStep;
  capitalization?: SerializedStep;
  emiSizing: SerializedStep;
  paymentApplication: SerializedStep;
  closingBalance: SerializedStep;
}

export interface SerializedEntry {
  monthIndex: number;
  dueDate: string;
  openingBalance: string;
  interestAccrued: string;
  interestPaid: string;
  principalPaid: string;
  emiAmount: string;
  extraPayment: string;
  capitalizedInterest: string;
  closingBalance: string;
  status: ScheduleEntry["status"];
  paymentDate: string | null;
  daysLate: number | null;
  breakdown: SerializedBreakdown;
}

export interface SerializedAuditLink {
  monthIndex: number;
  openingBalance: string;
  interestPosted: string;
  capitalized: string;
  regularPayment: string;
  extraPayment: string;
  closingBalance: string;
  reconciles: boolean;
}

function serializeStep(step: CalculationStep): SerializedStep {
  return {
    key: step.key,
    formula: step.formula,
    explanation: step.explanation,
    value: step.value.toFixed(2),
  };
}

function serializeBreakdown(breakdown: CalculationBreakdown): SerializedBreakdown {
  return {
    openingBalance: serializeStep(breakdown.openingBalance),
    rateApplied: serializeStep(breakdown.rateApplied),
    daysCounted: serializeStep(breakdown.daysCounted),
    interestAccrual: serializeStep(breakdown.interestAccrual),
    capitalization: breakdown.capitalization
      ? serializeStep(breakdown.capitalization)
      : undefined,
    emiSizing: serializeStep(breakdown.emiSizing),
    paymentApplication: serializeStep(breakdown.paymentApplication),
    closingBalance: serializeStep(breakdown.closingBalance),
  };
}

export function serializeEntries(entries: ScheduleEntry[]): SerializedEntry[] {
  return entries.map((e) => ({
    monthIndex: e.monthIndex,
    dueDate: e.dueDate.toISOString(),
    openingBalance: e.openingBalance.toFixed(2),
    interestAccrued: e.interestAccrued.toFixed(2),
    interestPaid: e.interestPaid.toFixed(2),
    principalPaid: e.principalPaid.toFixed(2),
    emiAmount: e.emiAmount.toFixed(2),
    extraPayment: e.extraPayment.toFixed(2),
    capitalizedInterest: e.capitalizedInterest.toFixed(2),
    closingBalance: e.closingBalance.toFixed(2),
    status: e.status,
    paymentDate: e.paymentDate ? e.paymentDate.toISOString() : null,
    daysLate: e.daysLate,
    breakdown: serializeBreakdown(e.breakdown),
  }));
}

export function serializeAuditChain(
  chain: BalanceAuditChainLink[],
): SerializedAuditLink[] {
  return chain.map((link) => ({
    monthIndex: link.monthIndex,
    openingBalance: link.openingBalance.toFixed(2),
    interestPosted: link.interestPosted.toFixed(2),
    capitalized: link.capitalized.toFixed(2),
    regularPayment: link.regularPayment.toFixed(2),
    extraPayment: link.extraPayment.toFixed(2),
    closingBalance: link.closingBalance.toFixed(2),
    reconciles: link.reconciles,
  }));
}

export type { ScheduleAnomaly };
