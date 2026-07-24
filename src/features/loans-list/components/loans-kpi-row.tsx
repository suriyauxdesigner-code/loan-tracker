"use client";

import { Calendar, Landmark, Wallet } from "lucide-react";
import { MetricCard } from "@/features/shell/components/metric-card";

export function LoansKpiRow({
  loanCount,
  totalOutstanding,
  monthlyEmi,
  nextEmi,
}: {
  loanCount: number;
  totalOutstanding: string;
  monthlyEmi: string;
  nextEmi: { value: string; date: string } | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard icon={Landmark} tone="violet" label="Active Loans" value={String(loanCount)} />
      <MetricCard icon={Wallet} tone="rose" label="Total Outstanding" value={totalOutstanding} />
      <MetricCard icon={Wallet} tone="amber" label="Monthly EMI" value={monthlyEmi} />
      <MetricCard
        icon={Calendar}
        tone="sky"
        label="Next EMI Due"
        value={nextEmi ? nextEmi.value : "—"}
        description={nextEmi ? nextEmi.date : undefined}
      />
    </div>
  );
}
