import type { ScheduleEntry } from "@/lib/loan-engine";

export interface MetricTrends {
  outstanding: number[];
  principalRepaid: number[];
  interestPaid: number[];
  interestAccrued: number[];
}

/** Presentational per-period trend arrays for sparklines — plain running
 * sums over already-computed ScheduleEntry[], never a new calculation.
 * Runs over the full schedule (past + projected future), which is what
 * gives the outstanding-balance sparkline its declining shape. */
export function computeMetricTrends(entries: ScheduleEntry[]): MetricTrends {
  const outstanding: number[] = [];
  const principalRepaid: number[] = [];
  const interestPaid: number[] = [];
  const interestAccrued: number[] = [];

  let cumPrincipal = 0;
  let cumInterestPaid = 0;
  let cumInterestAccrued = 0;

  for (const entry of entries) {
    outstanding.push(entry.closingBalance.toNumber());
    cumPrincipal += entry.principalPaid.toNumber();
    principalRepaid.push(cumPrincipal);
    cumInterestPaid += entry.interestPaid.toNumber();
    interestPaid.push(cumInterestPaid);
    cumInterestAccrued += entry.interestAccrued.toNumber();
    interestAccrued.push(cumInterestAccrued);
  }

  return { outstanding, principalRepaid, interestPaid, interestAccrued };
}
