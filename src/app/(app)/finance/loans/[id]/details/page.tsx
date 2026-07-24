import {
  AlertTriangle,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Hash,
  Landmark,
  Percent,
  Repeat,
  Tag,
  TrendingDown,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconContainer } from "@/components/ui/icon-container";
import { Sparkline } from "@/components/ui/sparkline";
import { buildBalanceAuditChain, generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { getLoanForUser } from "@/features/loans/get-loan";
import { computeLoanMetrics } from "@/features/loans/metrics";
import { buildLoanTimeline, deriveLoanStage } from "@/features/loans/stage";
import { computeInterestSaved } from "@/features/loans/interest-saved";
import { serializeAuditChain } from "@/features/loans/serialize";
import { MoratoriumTimeline } from "@/features/loans/components/moratorium-timeline";
import { DisbursementTimeline } from "@/features/loans/components/disbursement-timeline";
import { buildRecentActivity } from "@/features/loans-overview/recent-activity";
import { computeMetricTrends } from "@/features/loans-overview/trends";
import { LoanTimeline } from "@/features/loans-overview/components/loan-timeline";
import { LoanProgress } from "@/features/loans-overview/components/loan-progress";
import { RecentActivityList } from "@/features/loans-overview/components/recent-activity-list";
import { SmartInsights } from "@/features/loans-overview/components/smart-insights";

function fmtDate(d: Date | null | undefined) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

const STAGE_LABEL: Record<string, string> = {
  CREATED: "Created",
  DISBURSEMENT: "Disbursement",
  STUDY_PERIOD: "Study period",
  MORATORIUM: "Moratorium",
  REPAYMENT: "Repayment",
  CLOSED: "Closed",
};

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <IconContainer icon={Icon} tone="slate" size="sm" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default async function LoanDetailsInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoanForUser(id);

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);
  const auditChain = buildBalanceAuditChain(result.entries);
  const auditLinks = serializeAuditChain(auditChain);

  const now = new Date();
  const metrics = computeLoanMetrics(
    result.entries,
    loan.principalAmount,
    result.anomalies,
    result.closureReason,
    now,
  );
  const stage = deriveLoanStage(loan, now);
  const timeline = buildLoanTimeline(loan, metrics.closureDate, now);
  const recentActivity = buildRecentActivity(loan);
  const interestSaved = computeInterestSaved(input, result);
  const trends = computeMetricTrends(result.entries);

  const disbursementRows = loan.disbursements.reduce<
    { id: string; date: Date; amount: string; remarks: string | null; runningTotal: string }[]
  >((acc, d) => {
    const prevTotal = acc.length > 0 ? Number(acc[acc.length - 1].runningTotal) : 0;
    const runningTotal = prevTotal + d.amount.toNumber();
    acc.push({
      id: d.id,
      date: d.date,
      amount: d.amount.toFixed(2),
      remarks: d.remarks,
      runningTotal: runningTotal.toFixed(2),
    });
    return acc;
  }, []);

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

      {/* Hero summary */}
      <Card className="bg-hero-gradient relative overflow-hidden">
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{loan.loanName}</h2>
                <Badge variant={metrics.loanHealthVariant}>{metrics.loanHealth}</Badge>
                <Badge variant="outline">{STAGE_LABEL[stage]}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {loan.bankName}
                {loan.loanAccountNumber ? ` · ${loan.loanAccountNumber}` : ""}
              </p>
            </div>
            {trends.outstanding.length > 1 && (
              <div className="w-full sm:w-56">
                <Sparkline data={trends.outstanding} tone="violet" height={48} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Outstanding</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {loan.currency} {metrics.outstanding.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Progress</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {metrics.completionPct.toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Next EMI</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {metrics.nextEntry ? `${loan.currency} ${metrics.nextEntry.emiAmount.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Expected Closure</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {fmtDate(metrics.closureDate)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <LoanTimeline steps={timeline} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LoanProgress
            principalProgressPct={metrics.principalProgressPct}
            interestProgressPct={metrics.interestProgressPct}
            completionPct={metrics.completionPct}
          />
        </div>
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

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconContainer icon={Landmark} tone="violet" size="sm" />
              <CardTitle className="text-base">Loan Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem icon={Landmark} label="Bank" value={loan.bankName} />
            <InfoItem icon={Hash} label="Account number" value={loan.loanAccountNumber || "—"} />
            <InfoItem icon={Tag} label="Loan type" value={loan.loanType.replaceAll("_", " ")} />
            <InfoItem icon={CalendarRange} label="Loan tenure" value={`${loan.loanTenureMonths} months`} />
            <InfoItem
              icon={CalendarClock}
              label="Repayment tenure"
              value={`${loan.repaymentTenureMonths} months`}
            />
            <InfoItem icon={Calendar} label="Sanction date" value={fmtDate(loan.sanctionDate)} />
            <InfoItem icon={CalendarCheck} label="EMI start date" value={fmtDate(loan.emiStartDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconContainer icon={Percent} tone="amber" size="sm" />
              <CardTitle className="text-base">Interest Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem icon={Percent} label="Rate" value={`${loan.interestRate.toString()}% p.a.`} />
            <InfoItem icon={Tag} label="Type" value={loan.interestType} />
            <InfoItem
              icon={Calculator}
              label="Calculation method"
              value={loan.settings!.calculationMethod.replaceAll("_", " ")}
            />
            <InfoItem icon={Repeat} label="Compounding" value={loan.settings!.compounding} />
            <InfoItem
              icon={Calendar}
              label="Day count convention"
              value={loan.settings!.dayCountConvention.replace("DAYS_", "")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconContainer icon={Wallet} tone="sky" size="sm" />
              <CardTitle className="text-base">Repayment Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem icon={Wallet} label="EMI type" value={loan.emiType.replaceAll("_", " ")} />
            <InfoItem
              icon={CalendarClock}
              label="Payment frequency"
              value={loan.settings!.paymentFrequency}
            />
            <InfoItem
              icon={TrendingDown}
              label="Prepayment strategy"
              value={loan.settings!.prepaymentStrategy.replaceAll("_", " ")}
            />
          </CardContent>
        </Card>

        {loan.hasMoratorium && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <IconContainer icon={CalendarRange} tone="amber" size="sm" />
                <CardTitle className="text-base">Moratorium</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <MoratoriumTimeline
                studyStartDate={loan.studyStartDate}
                studyEndDate={loan.studyEndDate}
                moratoriumStartDate={loan.moratoriumStartDate}
                moratoriumEndDate={loan.moratoriumEndDate}
                emiStartDate={loan.emiStartDate}
                now={now}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={Wallet}
                  label="Interest during moratorium"
                  value={loan.moratoriumInterestPayment}
                />
                <InfoItem
                  icon={Repeat}
                  label="Capitalize unpaid interest"
                  value={loan.capitalizeUnpaidInterest ? "Yes" : "No"}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconContainer icon={Wallet} tone="emerald" size="sm" />
              <CardTitle className="text-base">Disbursement History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DisbursementTimeline rows={disbursementRows} currency={loan.currency} />
          </CardContent>
        </Card>

        <RecentActivityList events={recentActivity} />
      </div>

      {/* Outstanding Summary / Calculation Audit Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Summary — Calculation Audit Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-hidden overflow-y-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-card sticky top-0">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-right">Opening</th>
                  <th className="p-2 text-right">Interest Posted</th>
                  <th className="p-2 text-right">Capitalized</th>
                  <th className="p-2 text-right">Payments</th>
                  <th className="p-2 text-right">Extra</th>
                  <th className="p-2 text-right">Closing</th>
                  <th className="p-2 text-center">Reconciles</th>
                </tr>
              </thead>
              <tbody>
                {auditLinks.map((link, i) => (
                  <tr
                    key={link.monthIndex}
                    className={`border-t ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                  >
                    <td className="p-2">{link.monthIndex}</td>
                    <td className="p-2 text-right">{link.openingBalance}</td>
                    <td className="p-2 text-right">{link.interestPosted}</td>
                    <td className="p-2 text-right">{link.capitalized}</td>
                    <td className="p-2 text-right">{link.regularPayment}</td>
                    <td className="p-2 text-right">{link.extraPayment}</td>
                    <td className="p-2 text-right">{link.closingBalance}</td>
                    <td className="p-2 text-center">
                      {link.reconciles ? "✓" : <Badge variant="destructive">Mismatch</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
