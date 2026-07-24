import { Decimal } from "decimal.js";
import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { computeLoanMetrics } from "@/features/loans/metrics";
import { deriveLoanStage, type LoanStage } from "@/features/loans/stage";
import type { LoanWithRelations } from "@/features/loans/get-loan";
import { buildRecentActivity, type ActivityEvent } from "@/features/loans-overview/recent-activity";

/** Amounts here are formatted strings, not Decimal instances — this data
 * flows into Client Components (framer-motion cards), and Decimal.js
 * instances can't cross the Server->Client Component boundary (React's
 * Flight serializer only understands plain data, not arbitrary class
 * instances). Decimal precision is still used for all the summation below;
 * only the final returned shape is stringified. */
export interface CurrencyTotal {
  currency: string;
  amount: string;
}

export interface UpcomingEmiAcrossLoans {
  loanId: string;
  loanName: string;
  currency: string;
  amount: string;
  dueDate: string;
}

export interface LoanSummaryRow {
  loanId: string;
  loanName: string;
  loanAccountNumber: string | null;
  bankName: string;
  loanType: string;
  status: string;
  stage: LoanStage;
  currency: string;
  outstanding: string;
  interestRate: string;
  monthlyEmi: string | null;
  nextEmiDate: string | null;
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
  monthlyEmiByCurrency: CurrencyTotal[];
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
  const monthlyEmiByCurrency = new Map<string, Decimal>();
  const trendByCurrency = new Map<string, Map<string, Decimal>>();
  let nearestUpcomingEmi: UpcomingEmiAcrossLoans | null = null;
  let nearestUpcomingEmiDueDate: Date | null = null;
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

    if (metrics.nextEntry) {
      monthlyEmiByCurrency.set(
        loan.currency,
        (monthlyEmiByCurrency.get(loan.currency) ?? new Decimal(0)).plus(metrics.nextEntry.emiAmount),
      );
    }

    const monthBuckets = trendByCurrency.get(loan.currency) ?? new Map<string, Decimal>();
    for (const entry of result.entries) {
      const key = `${entry.dueDate.getFullYear()}-${String(entry.dueDate.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.set(key, (monthBuckets.get(key) ?? new Decimal(0)).plus(entry.closingBalance));
    }
    trendByCurrency.set(loan.currency, monthBuckets);

    loanSummaries.push({
      loanId: loan.id,
      loanName: loan.loanName,
      loanAccountNumber: loan.loanAccountNumber,
      bankName: loan.bankName,
      loanType: loan.loanType,
      status: loan.status,
      stage: deriveLoanStage(loan, now),
      currency: loan.currency,
      outstanding: metrics.outstanding.toFixed(2),
      interestRate: loan.interestRate.toString(),
      monthlyEmi: metrics.nextEntry ? metrics.nextEntry.emiAmount.toFixed(2) : null,
      nextEmiDate: metrics.nextEntry ? metrics.nextEntry.dueDate.toISOString() : null,
      completionPct: metrics.completionPct,
    });

    if (
      metrics.nextEntry &&
      (!nearestUpcomingEmiDueDate || metrics.nextEntry.dueDate < nearestUpcomingEmiDueDate)
    ) {
      nearestUpcomingEmiDueDate = metrics.nextEntry.dueDate;
      nearestUpcomingEmi = {
        loanId: loan.id,
        loanName: loan.loanName,
        currency: loan.currency,
        amount: metrics.nextEntry.emiAmount.toFixed(2),
        dueDate: metrics.nextEntry.dueDate.toISOString(),
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
      amount: amount.toFixed(2),
    })),
    monthlyEmiByCurrency: Array.from(monthlyEmiByCurrency, ([currency, amount]) => ({
      currency,
      amount: amount.toFixed(2),
    })),
    outstandingTrend,
    nearestUpcomingEmi,
    loanSummaries,
    recentActivity,
  };
}
