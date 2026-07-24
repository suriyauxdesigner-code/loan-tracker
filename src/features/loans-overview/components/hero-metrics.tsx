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
import { MetricCard } from "@/features/shell/components/metric-card";
import type { MetricTrends } from "../trends";

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "—";
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
  trends,
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
  trends: MetricTrends;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        icon={Wallet}
        tone="violet"
        label="Current Outstanding"
        value={`${currency} ${outstanding}`}
        sparklineData={trends.outstanding}
      />
      <MetricCard
        icon={Landmark}
        tone="violet"
        label="Original Loan Amount"
        value={`${currency} ${principalAmount}`}
      />
      <MetricCard
        icon={PiggyBank}
        tone="emerald"
        label="Principal Repaid"
        value={`${currency} ${principalRepaid}`}
        sparklineData={trends.principalRepaid}
      />
      <MetricCard
        icon={TrendingDown}
        tone="amber"
        label="Interest Paid"
        value={`${currency} ${interestPaid}`}
        sparklineData={trends.interestPaid}
      />
      <MetricCard
        icon={TrendingUp}
        tone="amber"
        label="Interest Accrued"
        value={`${currency} ${interestAccrued}`}
        sparklineData={trends.interestAccrued}
      />
      <MetricCard
        icon={CircleDollarSign}
        tone="sky"
        label="Remaining Principal"
        value={`${currency} ${remainingPrincipal}`}
      />
      <MetricCard
        icon={Wallet}
        tone="rose"
        label="Next EMI"
        value={nextEmiAmount ? `${currency} ${nextEmiAmount}` : "—"}
      />
      <MetricCard icon={ListOrdered} tone="slate" label="Remaining EMIs" value={String(remainingEmiCount)} />
      <MetricCard icon={Percent} tone="slate" label="Current Interest Rate" value={`${currentRate}% p.a.`} />
      <MetricCard icon={Calendar} tone="slate" label="Expected Closure" value={fmtDate(closureDate)} />
    </div>
  );
}
