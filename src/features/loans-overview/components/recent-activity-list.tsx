import { CircleDollarSign, History, Landmark, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEvent } from "../recent-activity";

const ICONS: Record<ActivityEvent["kind"], LucideIcon> = {
  LOAN_CREATED: Landmark,
  DISBURSEMENT: CircleDollarSign,
  PAYMENT: Receipt,
};

export function RecentActivityList({ events }: { events: ActivityEvent[] }) {
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
            description="Disbursements and payments will show up here as they're recorded."
          />
        ) : (
          <ul className="space-y-3">
            {events.map((event, i) => {
              const Icon = ICONS[event.kind];
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-muted rounded-full p-1.5">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-muted-foreground text-xs">{event.detail}</p>
                  </div>
                  <p className="text-muted-foreground shrink-0 text-xs">
                    {event.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
