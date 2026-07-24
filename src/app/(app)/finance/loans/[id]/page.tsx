import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { getLoanForUser } from "@/features/loans/get-loan";
import { computeLoanMetrics } from "@/features/loans/metrics";
import { buildLoanTimeline } from "@/features/loans/stage";
import { computeInterestSaved } from "@/features/loans/interest-saved";
import { buildRecentActivity } from "@/features/loans-overview/recent-activity";
import { computeMetricTrends } from "@/features/loans-overview/trends";
import { HeroMetrics } from "@/features/loans-overview/components/hero-metrics";
import { LoanProgress } from "@/features/loans-overview/components/loan-progress";
import { QuickActions } from "@/features/loans-overview/components/quick-actions";
import { LoanTimeline } from "@/features/loans-overview/components/loan-timeline";
import { UpcomingEmi } from "@/features/loans-overview/components/upcoming-emi";
import { RecentActivityList } from "@/features/loans-overview/components/recent-activity-list";
import { SmartInsights } from "@/features/loans-overview/components/smart-insights";

export default async function LoanOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoanForUser(id);

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);

  const now = new Date();
  const metrics = computeLoanMetrics(
    result.entries,
    loan.principalAmount,
    result.anomalies,
    result.closureReason,
    now,
  );
  const timeline = buildLoanTimeline(loan, metrics.closureDate, now);
  const interestSaved = computeInterestSaved(input, result);
  const recentActivity = buildRecentActivity(loan);
  const trends = computeMetricTrends(result.entries);

  return (
    <div className="flex flex-col gap-6">
      {result.anomalies.length > 0 && (
        <div className="space-y-2">
          {result.anomalies.map((a, i) => (
            <Alert key={i} variant={a.severity === "error" ? "destructive" : "default"}>
              <AlertTriangle />
              <AlertTitle>
                {a.monthIndex ? `Month ${a.monthIndex}` : "Schedule"} — {a.code.replaceAll("_", " ")}
              </AlertTitle>
              <AlertDescription>{a.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <HeroMetrics
        currency={loan.currency}
        outstanding={metrics.outstanding.toFixed(2)}
        principalAmount={loan.principalAmount.toFixed(2)}
        principalRepaid={metrics.principalRepaid.toFixed(2)}
        interestPaid={metrics.interestPaid.toFixed(2)}
        interestAccrued={metrics.interestAccrued.toFixed(2)}
        remainingPrincipal={metrics.remainingPrincipal.toFixed(2)}
        nextEmiAmount={metrics.nextEntry ? metrics.nextEntry.emiAmount.toFixed(2) : null}
        remainingEmiCount={metrics.remainingEmiCount}
        currentRate={loan.interestRate.toString()}
        closureDate={metrics.closureDate}
        trends={trends}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LoanProgress
            principalProgressPct={metrics.principalProgressPct}
            interestProgressPct={metrics.interestProgressPct}
            completionPct={metrics.completionPct}
          />
        </div>
        <UpcomingEmi
          currency={loan.currency}
          dueDate={metrics.nextEntry?.dueDate ?? null}
          amount={metrics.nextEntry ? metrics.nextEntry.emiAmount.toFixed(2) : null}
          status={metrics.nextEntry?.status ?? null}
          now={now}
        />
      </div>

      <QuickActions loanId={id} />

      <LoanTimeline steps={timeline} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityList events={recentActivity} />
        <SmartInsights
          principalProgressPct={metrics.principalProgressPct}
          remainingEmiCount={metrics.remainingEmiCount}
          nextEmiDays={
            metrics.nextEntry
              ? Math.ceil((metrics.nextEntry.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null
          }
          currency={loan.currency}
          interestSaved={interestSaved ? interestSaved.toFixed(2) : null}
        />
      </div>
    </div>
  );
}
