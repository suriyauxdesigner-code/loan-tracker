import Link from "next/link";
import { Landmark, PiggyBank, Receipt, Scale, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrencyTotal } from "../aggregate-metrics";

function ModuleCard({
  icon: Icon,
  title,
  href,
  stat,
  comingSoon,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  stat?: string;
  comingSoon?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 h-full transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="text-muted-foreground size-4" />
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
      <ModuleCard icon={Landmark} title="Loans" href="/finance/loans" stat={loansStat} />
      <ModuleCard icon={Receipt} title="Expenses" href="/finance/expenses" comingSoon />
      <ModuleCard icon={PiggyBank} title="Savings" href="/finance/savings" comingSoon />
      <ModuleCard icon={TrendingUp} title="Investments" href="/finance/investments" comingSoon />
      <ModuleCard icon={Scale} title="Net Worth" href="/finance/net-worth" comingSoon />
    </div>
  );
}
