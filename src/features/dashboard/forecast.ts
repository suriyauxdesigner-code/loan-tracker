import type { ScheduleEntry } from "@/lib/loan-engine";

/** Reshapes already-computed engine output into plain, chart-ready
 * numbers. No financial calculation happens here — every value is read
 * straight off ScheduleEntry. */

export interface ForecastPoint {
  monthIndex: number;
  date: string;
  outstanding: number;
  principal: number;
  interest: number;
  cumulativeInterest: number;
  isPast: boolean;
}

export function buildForecastSeries(entries: ScheduleEntry[], now: Date): ForecastPoint[] {
  let cumulativeInterest = 0;
  return entries.map((e) => {
    cumulativeInterest += e.interestAccrued.toNumber();
    return {
      monthIndex: e.monthIndex,
      date: e.dueDate.toISOString(),
      outstanding: e.closingBalance.toNumber(),
      principal: e.principalPaid.toNumber(),
      interest: e.interestAccrued.toNumber(),
      cumulativeInterest,
      isPast: e.dueDate <= now,
    };
  });
}
