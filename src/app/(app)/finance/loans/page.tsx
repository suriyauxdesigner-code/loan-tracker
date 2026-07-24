import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLoansForUser } from "@/features/loans/get-loan";
import { computeFinancialOverview } from "@/features/overview/aggregate-metrics";
import { LoansKpiRow } from "@/features/loans-list/components/loans-kpi-row";
import { LoansTable } from "@/features/loans-list/components/loans-table";

export default async function LoansListPage() {
  const loans = await getLoansForUser();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
          <p className="text-muted-foreground text-sm">
            Every loan you&apos;re tracking, in one place.
          </p>
        </div>
        <Button size="sm" render={<Link href="/finance/loans/new" />}>
          <Plus />
          Add loan
        </Button>
      </div>

      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans yet"
          description="Add your first loan to start tracking it against a real amortization schedule."
          action={
            <Button className="mt-2" render={<Link href="/finance/loans/new" />}>
              Add your first loan
            </Button>
          }
        />
      ) : (
        <LoansContent loans={loans} />
      )}
    </div>
  );
}

async function LoansContent({ loans }: { loans: Awaited<ReturnType<typeof getLoansForUser>> }) {
  const now = new Date();
  const overview = computeFinancialOverview(loans, now);

  return (
    <div className="flex flex-col gap-6">
      <LoansKpiRow
        loanCount={overview.loanCount}
        totalOutstanding={
          overview.outstandingByCurrency[0]
            ? `${overview.outstandingByCurrency[0].currency} ${overview.outstandingByCurrency[0].amount}`
            : "—"
        }
        monthlyEmi={
          overview.monthlyEmiByCurrency[0]
            ? `${overview.monthlyEmiByCurrency[0].currency} ${overview.monthlyEmiByCurrency[0].amount}`
            : "—"
        }
        nextEmi={
          overview.nearestUpcomingEmi
            ? {
                value: `${overview.nearestUpcomingEmi.currency} ${overview.nearestUpcomingEmi.amount}`,
                date: new Date(overview.nearestUpcomingEmi.dueDate).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                }),
              }
            : null
        }
      />

      <LoansTable rows={overview.loanSummaries} />
    </div>
  );
}
