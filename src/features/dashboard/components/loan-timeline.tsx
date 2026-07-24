import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TimelineStep } from "@/features/loan-details/stage";

function fmtDate(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "TBD";
}

export function LoanTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Loan Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className={cn(
                "min-w-36 rounded-lg border px-3 py-2",
                step.isCurrent && "border-primary bg-primary/5",
                step.isPast && "opacity-70",
              )}
            >
              <div className="flex items-center gap-1.5">
                {step.isPast && <Check className="text-primary size-3" />}
                <p className="text-muted-foreground text-xs">{step.label}</p>
              </div>
              <p className="text-sm font-medium">{fmtDate(step.date)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
