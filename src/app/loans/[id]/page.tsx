import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server-client";
import { buildBalanceAuditChain, generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { serializeAuditChain, serializeEntries } from "@/features/loan-details/serialize";
import { ScheduleTable } from "@/features/loan-details/components/schedule-table";

function fmtDate(d: Date | null | undefined) {
  return d ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function LoanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) redirect("/login");

  const loan = await prisma.loan.findFirst({
    where: { id, user: { email: authUser.email } },
    include: {
      settings: true,
      disbursements: { orderBy: { date: "asc" } },
      payments: { orderBy: { date: "asc" } },
      importSnapshot: true,
    },
  });

  if (!loan || !loan.settings) notFound();

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);
  const auditChain = buildBalanceAuditChain(result.entries);
  const entries = serializeEntries(result.entries);
  const auditLinks = serializeAuditChain(auditChain);

  const now = new Date();
  const pastEntries = result.entries.filter((e) => e.dueDate <= now);
  const currentEntry = pastEntries[pastEntries.length - 1] ?? null;
  const outstanding = currentEntry
    ? currentEntry.closingBalance
    : (result.entries[0]?.openingBalance ?? null);
  const nextEntry = result.entries.find((e) => e.dueDate > now) ?? null;

  const hasErrors = result.anomalies.some((a) => a.severity === "error");
  const hasMissed = result.entries.some((e) => e.status === "MISSED");
  const loanHealth = hasErrors
    ? "Attention needed"
    : hasMissed
      ? "Behind schedule"
      : result.closureReason === "FORECLOSURE"
        ? "Ahead of schedule"
        : "On track";
  const healthVariant = hasErrors || hasMissed ? "destructive" : "default";

  const totalInterestPaid = result.entries.reduce(
    (sum, e) => sum + e.interestPaid.toNumber(),
    0,
  );
  const totalPrincipalPaid = result.entries.reduce(
    (sum, e) => sum + e.principalPaid.toNumber(),
    0,
  );
  const totalDisbursed = loan.disbursements.reduce(
    (sum, d) => sum + d.amount.toNumber(),
    0,
  );

  const timeline: { label: string; date: Date | null }[] = [
    { label: "Sanctioned", date: loan.sanctionDate },
    ...loan.disbursements.map((d, i) => ({
      label: loan.disbursements.length > 1 ? `Disbursement ${i + 1}` : "Disbursed",
      date: d.date,
    })),
    ...(loan.hasMoratorium
      ? [
          { label: "Moratorium start", date: loan.moratoriumStartDate },
          { label: "Moratorium end", date: loan.moratoriumEndDate },
        ]
      : []),
    { label: "EMI start", date: loan.emiStartDate },
    {
      label: loan.status === "CLOSED" ? "Closed" : "Projected closure",
      date: result.entries[result.entries.length - 1]?.dueDate ?? null,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/" />}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{loan.loanName}</h1>
          <p className="text-muted-foreground text-sm">
            {loan.bankName} · {loan.loanType.replaceAll("_", " ")}
          </p>
        </div>
      </div>

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

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Overview</CardTitle>
            <Badge variant={healthVariant}>{loanHealth}</Badge>
            <Badge variant="outline">{loan.status.replaceAll("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Outstanding</p>
            <p className="text-lg font-semibold">
              {loan.currency} {outstanding?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Interest paid to date</p>
            <p className="text-lg font-semibold">
              {loan.currency} {totalInterestPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Principal paid to date</p>
            <p className="text-lg font-semibold">
              {loan.currency} {totalPrincipalPaid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Next due</p>
            <p className="text-lg font-semibold">{fmtDate(nextEntry?.dueDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Remaining installments</p>
            <p className="text-lg font-semibold">
              {result.entries.filter((e) => e.dueDate > now).length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {loan.status === "CLOSED" ? "Closed on" : "Projected closure"}
            </p>
            <p className="text-lg font-semibold">
              {fmtDate(result.entries[result.entries.length - 1]?.dueDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loan Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {timeline.map((t, i) => (
              <div key={i} className="min-w-32 rounded-lg border px-3 py-2">
                <p className="text-muted-foreground text-xs">{t.label}</p>
                <p className="text-sm font-medium">{fmtDate(t.date)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Loan Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="Bank" value={loan.bankName} />
            <Row label="Account number" value={loan.loanAccountNumber || "—"} />
            <Row label="Loan type" value={loan.loanType.replaceAll("_", " ")} />
            <Row
              label="Principal"
              value={`${loan.currency} ${loan.principalAmount.toString()}`}
            />
            <Row label="Loan tenure" value={`${loan.loanTenureMonths} months`} />
            <Row label="Repayment tenure" value={`${loan.repaymentTenureMonths} months`} />
          </CardContent>
        </Card>

        {/* Interest Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interest Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="Rate" value={`${loan.interestRate.toString()}% p.a.`} />
            <Row label="Type" value={loan.interestType} />
            <Row label="Calculation method" value={loan.settings.calculationMethod.replaceAll("_", " ")} />
            <Row label="Compounding" value={loan.settings.compounding} />
            <Row label="Day count convention" value={loan.settings.dayCountConvention.replace("DAYS_", "")} />
          </CardContent>
        </Card>

        {/* Disbursement History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disbursement History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loan.disbursements.map((d) => (
              <Row
                key={d.id}
                label={fmtDate(d.date)}
                value={`${loan.currency} ${d.amount.toString()}`}
              />
            ))}
            <Separator />
            <Row label="Total disbursed" value={`${loan.currency} ${totalDisbursed.toFixed(2)}`} />
          </CardContent>
        </Card>

        {/* Repayment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repayment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="EMI type" value={loan.emiType.replaceAll("_", " ")} />
            <Row label="Payment frequency" value={loan.settings.paymentFrequency} />
            <Row label="Prepayment strategy" value={loan.settings.prepaymentStrategy.replaceAll("_", " ")} />
          </CardContent>
        </Card>

        {loan.hasMoratorium && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moratorium Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Row label="Start" value={fmtDate(loan.moratoriumStartDate)} />
              <Row label="End" value={fmtDate(loan.moratoriumEndDate)} />
              <Row label="Interest handling" value={loan.moratoriumInterestPayment} />
              <Row
                label="Capitalize unpaid interest"
                value={loan.capitalizeUnpaidInterest ? "Yes" : "No"}
              />
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
                      {link.reconciles ? (
                        "✓"
                      ) : (
                        <Badge variant="destructive">Mismatch</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly EMI Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly EMI Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleTable entries={entries} currency={loan.currency} />
        </CardContent>
      </Card>
    </main>
  );
}
