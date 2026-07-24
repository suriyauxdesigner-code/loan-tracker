import Link from "next/link";
import { FileDown, ListChecks, PlusCircle, Receipt, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ActionButton({
  icon: Icon,
  label,
  href,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <Button variant="outline" className="h-auto flex-col gap-1.5 py-3" disabled>
        <Icon className="size-4" />
        <span className="text-xs font-normal">{label}</span>
        <span className="text-muted-foreground text-[10px]">Coming soon</span>
      </Button>
    );
  }
  return (
    <Button variant="outline" className="h-auto flex-col gap-1.5 py-3" render={<Link href={href} />}>
      <Icon className="size-4" />
      <span className="text-xs font-normal">{label}</span>
    </Button>
  );
}

export function QuickActions({ loanId }: { loanId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <ActionButton icon={Receipt} label="Record Payment" disabled />
        <ActionButton icon={PlusCircle} label="Make Extra Payment" disabled />
        <ActionButton icon={Wallet} label="View Loan Details" href={`/loans/${loanId}/details`} />
        <ActionButton icon={ListChecks} label="View EMI Schedule" href={`/loans/${loanId}/schedule`} />
        <ActionButton icon={TrendingUp} label="Run Payoff Simulation" disabled />
        <ActionButton icon={FileDown} label="Download Statement" disabled />
      </CardContent>
    </Card>
  );
}
