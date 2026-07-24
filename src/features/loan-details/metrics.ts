import { Decimal } from "decimal.js";
import type { ClosureReason, ScheduleAnomaly, ScheduleEntry } from "@/lib/loan-engine";

/** Presentational aggregation of already-computed engine output — sums
 * and ratios over ScheduleEntry fields, never a fresh financial
 * calculation. Shared by the Dashboard, Details, and Schedule pages so
 * "as of today" figures are derived consistently everywhere (in
 * particular: only past/due entries count toward "paid to date," never
 * future projected ones — those are a projection, not a real payment). */
export interface LoanMetrics {
  outstanding: Decimal;
  principalRepaid: Decimal;
  interestPaid: Decimal;
  interestAccrued: Decimal;
  interestOutstanding: Decimal;
  remainingPrincipal: Decimal;
  nextEntry: ScheduleEntry | null;
  remainingEmiCount: number;
  currentEntry: ScheduleEntry | null;
  closureDate: Date | null;
  principalProgressPct: number;
  interestProgressPct: number;
  completionPct: number;
  loanHealth: "Attention needed" | "Behind schedule" | "Ahead of schedule" | "On track";
  loanHealthVariant: "destructive" | "default";
}

export function computeLoanMetrics(
  entries: ScheduleEntry[],
  principalAmount: Decimal,
  anomalies: ScheduleAnomaly[],
  closureReason: ClosureReason | null,
  now: Date,
): LoanMetrics {
  const pastEntries = entries.filter((e) => e.dueDate <= now);
  const currentEntry = pastEntries[pastEntries.length - 1] ?? null;
  const outstanding = currentEntry
    ? currentEntry.closingBalance
    : (entries[0]?.openingBalance ?? new Decimal(0));

  const principalRepaid = pastEntries.reduce(
    (sum, e) => sum.plus(e.principalPaid),
    new Decimal(0),
  );
  const interestPaid = pastEntries.reduce(
    (sum, e) => sum.plus(e.interestPaid),
    new Decimal(0),
  );
  const interestAccrued = pastEntries.reduce(
    (sum, e) => sum.plus(e.interestAccrued),
    new Decimal(0),
  );
  const interestOutstanding = Decimal.max(0, interestAccrued.minus(interestPaid));
  const remainingPrincipal = Decimal.max(0, principalAmount.minus(principalRepaid));

  const nextEntry = entries.find((e) => e.dueDate > now) ?? null;
  const remainingEmiCount = entries.filter((e) => e.dueDate > now).length;

  const totalInterestOverLife = entries.reduce(
    (sum, e) => sum.plus(e.interestAccrued),
    new Decimal(0),
  );

  const principalProgressPct = principalAmount.isZero()
    ? 0
    : principalRepaid.dividedBy(principalAmount).times(100).toNumber();
  const interestProgressPct = totalInterestOverLife.isZero()
    ? 0
    : interestPaid.dividedBy(totalInterestOverLife).times(100).toNumber();
  const completionPct =
    entries.length === 0 ? 0 : (pastEntries.length / entries.length) * 100;

  const hasErrors = anomalies.some((a) => a.severity === "error");
  const hasMissed = entries.some((e) => e.status === "MISSED");
  const loanHealth: LoanMetrics["loanHealth"] = hasErrors
    ? "Attention needed"
    : hasMissed
      ? "Behind schedule"
      : closureReason === "FORECLOSURE"
        ? "Ahead of schedule"
        : "On track";

  return {
    outstanding,
    principalRepaid,
    interestPaid,
    interestAccrued,
    interestOutstanding,
    remainingPrincipal,
    nextEntry,
    remainingEmiCount,
    currentEntry,
    closureDate: entries[entries.length - 1]?.dueDate ?? null,
    principalProgressPct,
    interestProgressPct,
    completionPct,
    loanHealth,
    loanHealthVariant: hasErrors || hasMissed ? "destructive" : "default",
  };
}
