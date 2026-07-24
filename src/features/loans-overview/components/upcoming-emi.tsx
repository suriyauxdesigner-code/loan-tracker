import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconContainer } from "@/components/ui/icon-container";

function daysUntil(date: Date, now: Date) {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function UpcomingEmi({
  currency,
  dueDate,
  amount,
  status,
  now,
}: {
  currency: string;
  dueDate: Date | null;
  amount: string | null;
  status: string | null;
  now: Date;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconContainer icon={CalendarClock} tone="rose" size="sm" />
          <CardTitle className="text-base">Upcoming EMI</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {dueDate && amount ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {currency} {amount}
              </p>
              <p className="text-muted-foreground text-sm">
                Due {dueDate.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}{" "}
                · {daysUntil(dueDate, now)} days remaining
              </p>
            </div>
            {status && <Badge variant="outline">{status.replaceAll("_", " ")}</Badge>}
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming EMI"
            description="This loan has no future installments scheduled."
          />
        )}
      </CardContent>
    </Card>
  );
}
