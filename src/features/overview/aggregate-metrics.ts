import { Decimal } from "decimal.js";
import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { computeLoanMetrics } from "@/features/loans/metrics";
import type { LoanWithRelations } from "@/features/loans/get-loan";
import { buildRecentActivity, type ActivityEvent } from "@/features/loans-overview/recent-activity";

export interface CurrencyTotal {
  currency: string;
  amount: Decimal;
}

export interface UpcomingEmiAcrossLoans {
  loanId: string;
  loanName: string;
  currency: string;
  amount: Decimal;
  dueDate: Date;
}

export interface LoanSummaryRow {
  loanId: string;
  loanName: string;
  currency: string;
  outstanding: Decimal;
  completionPct: number;
}

export interface OverviewActivityEvent extends ActivityEvent {
  loanId: string;
  loanName: string;
}

export interface CurrencyTrend {
  currency: string;
  points: number[];
}

export interface FinancialOverview {
  loanCount: number;
  outstandingByCurrency: CurrencyTotal[];
  outstandingTrend: CurrencyTrend[];
  nearestUpcomingEmi: UpcomingEmiAcrossLoans | null;
  loanSummaries: LoanSummaryRow[];
  recentActivity: OverviewActivityEvent[];
}

/** Presentational fan-out over per-loan engine output — every number
 * still comes from generateSchedule()/computeLoanMetrics() for that one
 * loan, this only sums/merges what's already computed. Never a new
 * calculation. Currency totals are grouped, not naively summed, since
 * loans can be in different currencies. */
export function computeFinancialOverview(loans: LoanWithRelations[], now: Date): FinancialOverview {
  const outstandingByCurrency = new Map<string, Decimal>();
  const trendByCurrency = new Map<string, Map<string, Decimal>>();
  let nearestUpcomingEmi: UpcomingEmiAcrossLoans | null = null;
  const loanSummaries: LoanSummaryRow[] = [];
  const activityByLoan: OverviewActivityEvent[] = [];

  for (const loan of loans) {
    const input = mapLoanToEngineInput(loan);
    const result = generateSchedule(input, now);
    const metrics = computeLoanMetrics(
      result.entries,
      loan.principalAmount,
      result.anomalies,
      result.closureReason,
      now,
    );

    outstandingByCurrency.set(
      loan.currency,
      (outstandingByCurrency.get(loan.currency) ?? new Decimal(0)).plus(metrics.outstanding),
    );

    const monthBuckets = trendByCurrency.get(loan.currency) ?? new Map<string, Decimal>();
    for (const entry of result.entries) {
      const key = `${entry.dueDate.getFullYear()}-${String(entry.dueDate.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.set(key, (monthBuckets.get(key) ?? new Decimal(0)).plus(entry.closingBalance));
    }
    trendByCurrency.set(loan.currency, monthBuckets);

    loanSummaries.push({
      loanId: loan.id,
      loanName: loan.loanName,
      currency: loan.currency,
      outstanding: metrics.outstanding,
      completionPct: metrics.completionPct,
    });

    if (
      metrics.nextEntry &&
      (!nearestUpcomingEmi || metrics.nextEntry.dueDate < nearestUpcomingEmi.dueDate)
    ) {
      nearestUpcomingEmi = {
        loanId: loan.id,
        loanName: loan.loanName,
        currency: loan.currency,
        amount: metrics.nextEntry.emiAmount,
        dueDate: metrics.nextEntry.dueDate,
      };
    }

    for (const event of buildRecentActivity(loan)) {
      activityByLoan.push({ ...event, loanId: loan.id, loanName: loan.loanName });
    }
  }

  const recentActivity = activityByLoan
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const outstandingTrend: CurrencyTrend[] = Array.from(trendByCurrency, ([currency, buckets]) => {
    const sortedKeys = Array.from(buckets.keys()).sort();
    return { currency, points: sortedKeys.map((key) => buckets.get(key)!.toNumber()) };
  });

  return {
    loanCount: loans.length,
    outstandingByCurrency: Array.from(outstandingByCurrency, ([currency, amount]) => ({
      currency,
      amount,
    })),
    outstandingTrend,
    nearestUpcomingEmi,
    loanSummaries,
    recentActivity,
  };
}
