"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Landmark, PiggyBank, Receipt, Scale, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconContainer, type IconTone } from "@/components/ui/icon-container";
import type { CurrencyTotal } from "../aggregate-metrics";

function ModuleCard({
  icon: Icon,
  tone,
  title,
  href,
  stat,
  comingSoon,
}: {
  icon: LucideIcon;
  tone: IconTone;
  title: string;
  href: string;
  stat?: string;
  comingSoon?: boolean;
}) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Link href={href}>
        <Card className="hover:shadow-hover h-full transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <IconContainer icon={Icon} tone={tone} />
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              {comingSoon && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  Coming soon
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {stat ?? "Track this once the module ships."}
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function ModuleCards({
  loanCount,
  outstandingByCurrency,
}: {
  loanCount: number;
  outstandingByCurrency: CurrencyTotal[];
}) {
  const loansStat =
    loanCount === 0
      ? "No loans yet"
      : `${loanCount} loan${loanCount === 1 ? "" : "s"} · ${outstandingByCurrency
          .map((t) => `${t.currency} ${t.amount.toFixed(2)}`)
          .join(", ")} outstanding`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ModuleCard icon={Landmark} tone="violet" title="Loans" href="/finance/loans" stat={loansStat} />
      <ModuleCard icon={Receipt} tone="amber" title="Expenses" href="/finance/expenses" comingSoon />
      <ModuleCard icon={PiggyBank} tone="emerald" title="Savings" href="/finance/savings" comingSoon />
      <ModuleCard
        icon={TrendingUp}
        tone="sky"
        title="Investments"
        href="/finance/investments"
        comingSoon
      />
      <ModuleCard icon={Scale} tone="slate" title="Net Worth" href="/finance/net-worth" comingSoon />
    </div>
  );
}
