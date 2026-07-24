import { redirect } from "next/navigation";
import { getLoansForUser } from "@/features/loans/get-loan";
import { computeFinancialOverview } from "@/features/overview/aggregate-metrics";
import { OverviewHero } from "@/features/overview/components/overview-hero";
import { ModuleCards } from "@/features/overview/components/module-cards";
import { OverviewRecentActivity } from "@/features/overview/components/overview-recent-activity";

export default async function DashboardPage() {
  const loans = await getLoansForUser();

  if (loans.length === 0) {
    redirect("/finance/loans/new");
  }

  const now = new Date();
  const overview = computeFinancialOverview(loans, now);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Financial Overview</h1>

      <OverviewHero
        loanCount={overview.loanCount}
        outstandingByCurrency={overview.outstandingByCurrency}
        nearestUpcomingEmi={overview.nearestUpcomingEmi}
      />

      <ModuleCards
        loanCount={overview.loanCount}
        outstandingByCurrency={overview.outstandingByCurrency}
      />

      <OverviewRecentActivity events={overview.recentActivity} />
    </div>
  );
}
