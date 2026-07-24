import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBalanceAuditChain, generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { getLoanForUser } from "@/features/loans/get-loan";
import { computeLoanMetrics } from "@/features/loans/metrics";
import { deriveLoanStage } from "@/features/loans/stage";
import { serializeAuditChain } from "@/features/loans/serialize";

function fmtDate(d: Date | null | undefined) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

const STAGE_LABEL: Record<string, string> = {
  CREATED: "Created",
  DISBURSEMENT: "Disbursement",
  STUDY_PERIOD: "Study period",
  MORATORIUM: "Moratorium",
  REPAYMENT: "Repayment",
  CLOSED: "Closed",
};

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

      {/* Loan Summary strip */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Loan Summary</CardTitle>
            <Badge variant={metrics.loanHealthVariant}>{metrics.loanHealth}</Badge>
            <Badge variant="outline">{STAGE_LABEL[stage]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Original loan" value={`${loan.currency} ${loan.principalAmount.toString()}`} />
          <Stat label="Outstanding" value={`${loan.currency} ${metrics.outstanding.toFixed(2)}`} />
          <Stat label="Principal paid" value={`${loan.currency} ${metrics.principalRepaid.toFixed(2)}`} />
          <Stat label="Interest paid" value={`${loan.currency} ${metrics.interestPaid.toFixed(2)}`} />
          <Stat label="Interest outstanding" value={`${loan.currency} ${metrics.interestOutstanding.toFixed(2)}`} />
          <Stat label="Remaining EMIs" value={String(metrics.remainingEmiCount)} />
          <Stat
            label="Expected closure"
            value={fmtDate(metrics.closureDate)}
          />
          <Stat label="Target closure" value={fmtDate(loan.targetClosureDate)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="Bank" value={loan.bankName} />
            <Row label="Account number" value={loan.loanAccountNumber || "—"} />
            <Row label="Loan type" value={loan.loanType.replaceAll("_", " ")} />
            <Row label="Loan tenure" value={`${loan.loanTenureMonths} months`} />
            <Row label="Repayment tenure" value={`${loan.repaymentTenureMonths} months`} />
            <Row label="Sanction date" value={fmtDate(loan.sanctionDate)} />
            <Row label="EMI start date" value={fmtDate(loan.emiStartDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interest Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="Rate" value={`${loan.interestRate.toString()}% p.a.`} />
            <Row label="Type" value={loan.interestType} />
            <Row label="Calculation method" value={loan.settings!.calculationMethod.replaceAll("_", " ")} />
            <Row label="Compounding" value={loan.settings!.compounding} />
            <Row label="Day count convention" value={loan.settings!.dayCountConvention.replace("DAYS_", "")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disbursement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="pb-1 text-left">Date</th>
                    <th className="pb-1 text-right">Amount</th>
                    <th className="pb-1 text-right">Running total</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursementRows.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="py-1">{fmtDate(d.date)}</td>
                      <td className="py-1 text-right">
                        {loan.currency} {d.amount}
                      </td>
                      <td className="py-1 text-right font-medium">
                        {loan.currency} {d.runningTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repayment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="EMI type" value={loan.emiType.replaceAll("_", " ")} />
            <Row label="Payment frequency" value={loan.settings!.paymentFrequency} />
            <Row label="Prepayment strategy" value={loan.settings!.prepaymentStrategy.replaceAll("_", " ")} />
          </CardContent>
        </Card>

        {loan.hasMoratorium && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moratorium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Row label="Study start" value={fmtDate(loan.studyStartDate)} />
              <Row label="Study end" value={fmtDate(loan.studyEndDate)} />
              <Row label="Grace period" value={loan.gracePeriodMonths ? `${loan.gracePeriodMonths} months` : "—"} />
              <Row label="Moratorium start" value={fmtDate(loan.moratoriumStartDate)} />
              <Row label="Moratorium end" value={fmtDate(loan.moratoriumEndDate)} />
              <Row label="Interest during moratorium" value={loan.moratoriumInterestPayment} />
              <Row
                label="Capitalize unpaid interest"
                value={loan.capitalizeUnpaidInterest ? "Yes" : "No"}
              />
              <Row label="Current status" value={STAGE_LABEL[stage]} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Outstanding Summary / Calculation Audit Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Summary — Calculation Audit Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
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
                {auditLinks.map((link) => (
                  <tr key={link.monthIndex} className="border-t">
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
