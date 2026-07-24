import Link from "next/link";
import { Calendar, Landmark, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CurrencyTotal, UpcomingEmiAcrossLoans } from "../aggregate-metrics";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "hover:border-primary/50 transition-colors" : undefined}>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="truncate text-xl font-semibold tracking-tight">{value}</p>
          {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
        </div>
        <Icon className="text-muted-foreground size-4 shrink-0" />
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function OverviewHero({
  loanCount,
  outstandingByCurrency,
  nearestUpcomingEmi,
}: {
  loanCount: number;
  outstandingByCurrency: CurrencyTotal[];
  nearestUpcomingEmi: UpcomingEmiAcrossLoans | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <MetricCard
        icon={Landmark}
        label="Active Loans"
        value={String(loanCount)}
        href="/finance/loans"
      />
      {outstandingByCurrency.length > 0 ? (
        outstandingByCurrency.map((t) => (
          <MetricCard
            key={t.currency}
            icon={Wallet}
            label="Total Outstanding Debt"
            value={`${t.currency} ${t.amount.toFixed(2)}`}
            href="/finance/loans"
          />
        ))
      ) : (
        <MetricCard icon={Wallet} label="Total Outstanding Debt" value="—" />
      )}
      {nearestUpcomingEmi ? (
        <MetricCard
          icon={Calendar}
          label="Nearest Upcoming EMI"
          value={`${nearestUpcomingEmi.currency} ${nearestUpcomingEmi.amount.toFixed(2)}`}
          sub={`${fmtDate(nearestUpcomingEmi.dueDate)} · ${nearestUpcomingEmi.loanName}`}
          href={`/finance/loans/${nearestUpcomingEmi.loanId}`}
        />
      ) : (
        <MetricCard icon={Calendar} label="Nearest Upcoming EMI" value="—" />
      )}
    </div>
  );
}
