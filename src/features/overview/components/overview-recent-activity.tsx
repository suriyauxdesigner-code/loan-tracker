import Link from "next/link";
import { CircleDollarSign, History, Landmark, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEvent } from "@/features/loans-overview/recent-activity";
import type { OverviewActivityEvent } from "../aggregate-metrics";

const ICONS: Record<ActivityEvent["kind"], LucideIcon> = {
  LOAN_CREATED: Landmark,
  DISBURSEMENT: CircleDollarSign,
  PAYMENT: Receipt,
};

export function OverviewRecentActivity({ events }: { events: OverviewActivityEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Disbursements and payments across your loans will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {events.map((event, i) => {
              const Icon = ICONS[event.kind];
              return (
                <li key={i}>
                  <Link
                    href={`/finance/loans/${event.loanId}`}
                    className="hover:bg-muted/40 -mx-2 flex items-start gap-3 rounded-md px-2 py-1"
                  >
                    <div className="bg-muted rounded-full p-1.5">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {event.detail} · {event.loanName}
                      </p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {event.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
