import {
  Calendar,
  CircleDollarSign,
  Landmark,
  ListOrdered,
  Percent,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
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
}

export function HeroMetrics({
  currency,
  outstanding,
  principalAmount,
  principalRepaid,
  interestPaid,
  interestAccrued,
  remainingPrincipal,
  nextEmiAmount,
  remainingEmiCount,
  currentRate,
  closureDate,
}: {
  currency: string;
  outstanding: string;
  principalAmount: string;
  principalRepaid: string;
  interestPaid: string;
  interestAccrued: string;
  remainingPrincipal: string;
  nextEmiAmount: string | null;
  remainingEmiCount: number;
  currentRate: string;
  closureDate: Date | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard icon={Wallet} label="Current Outstanding" value={`${currency} ${outstanding}`} />
      <MetricCard icon={Landmark} label="Original Loan Amount" value={`${currency} ${principalAmount}`} />
      <MetricCard icon={PiggyBank} label="Principal Repaid" value={`${currency} ${principalRepaid}`} />
      <MetricCard icon={TrendingDown} label="Interest Paid" value={`${currency} ${interestPaid}`} />
      <MetricCard icon={TrendingUp} label="Interest Accrued" value={`${currency} ${interestAccrued}`} />
      <MetricCard icon={CircleDollarSign} label="Remaining Principal" value={`${currency} ${remainingPrincipal}`} />
      <MetricCard
        icon={Wallet}
        label="Next EMI"
        value={nextEmiAmount ? `${currency} ${nextEmiAmount}` : "—"}
      />
      <MetricCard icon={ListOrdered} label="Remaining EMIs" value={String(remainingEmiCount)} />
      <MetricCard icon={Percent} label="Current Interest Rate" value={`${currentRate}% p.a.`} />
      <MetricCard icon={Calendar} label="Expected Closure" value={fmtDate(closureDate)} />
    </div>
  );
}
