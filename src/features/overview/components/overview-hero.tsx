"use client";

import { motion } from "framer-motion";
import { Calendar, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { MetricCard } from "@/features/shell/components/metric-card";
import type { CurrencyTotal, CurrencyTrend, UpcomingEmiAcrossLoans } from "../aggregate-metrics";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function OverviewHero({
  loanCount,
  outstandingByCurrency,
  outstandingTrend,
  nearestUpcomingEmi,
}: {
  loanCount: number;
  outstandingByCurrency: CurrencyTotal[];
  outstandingTrend: CurrencyTrend[];
  nearestUpcomingEmi: UpcomingEmiAcrossLoans | null;
}) {
  const primary = outstandingByCurrency[0];
  const trend = outstandingTrend.find((t) => t.currency === primary?.currency);

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-hero-gradient relative overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Outstanding Debt</p>
              {primary ? (
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {primary.currency} {primary.amount}
                </p>
              ) : (
                <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">—</p>
              )}
              {outstandingByCurrency.length > 1 && (
                <p className="text-muted-foreground mt-1 text-xs">
                  +
                  {outstandingByCurrency
                    .slice(1)
                    .map((t) => `${t.currency} ${t.amount}`)
                    .join(", ")}{" "}
                  in other currencies
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                Across {loanCount} active loan{loanCount === 1 ? "" : "s"}
              </p>
            </div>
            {trend && trend.points.length > 1 && (
              <div className="w-full sm:w-56">
                <Sparkline data={trend.points} tone="violet" height={64} />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          icon={Landmark}
          tone="slate"
          label="Active Loans"
          value={String(loanCount)}
          href="/finance/loans"
        />
        {nearestUpcomingEmi ? (
          <MetricCard
            icon={Calendar}
            tone="rose"
            label="Nearest Upcoming EMI"
            value={`${nearestUpcomingEmi.currency} ${nearestUpcomingEmi.amount}`}
            description={`${fmtDate(nearestUpcomingEmi.dueDate)} · ${nearestUpcomingEmi.loanName}`}
            href={`/finance/loans/${nearestUpcomingEmi.loanId}`}
          />
        ) : (
          <MetricCard icon={Calendar} tone="rose" label="Nearest Upcoming EMI" value="—" />
        )}
      </div>
    </div>
  );
}
