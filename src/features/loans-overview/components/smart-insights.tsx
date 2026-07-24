import { Lightbulb, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function Insight({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <span>{text}</span>
    </li>
  );
}

export function SmartInsights({
  principalProgressPct,
  remainingEmiCount,
  nextEmiDays,
  currency,
  interestSaved,
}: {
  principalProgressPct: number;
  remainingEmiCount: number;
  nextEmiDays: number | null;
  currency: string;
  interestSaved: string | null;
}) {
  const insights: string[] = [
    `You've repaid ${principalProgressPct.toFixed(0)}% of your principal so far.`,
  ];
  if (nextEmiDays != null) {
    insights.push(
      nextEmiDays <= 0
        ? "Your next EMI is due now."
        : `Your next EMI is due in ${nextEmiDays} day${nextEmiDays === 1 ? "" : "s"}.`,
    );
  }
  if (remainingEmiCount > 0) {
    insights.push(`${remainingEmiCount} EMI${remainingEmiCount === 1 ? "" : "s"} remaining until closure.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Smart Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {insights.map((text, i) => (
            <Insight key={i} text={text} />
          ))}
        </ul>

        {interestSaved != null ? (
          <div className="flex items-start gap-2 rounded-lg border bg-emerald-500/5 p-3 text-sm">
            <PiggyBank className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>
              You&apos;ve saved <strong>{currency} {interestSaved}</strong> in interest through extra
              payments made so far.
            </span>
          </div>
        ) : (
          <EmptyState
            icon={PiggyBank}
            title="No extra payments yet"
            description="Make an extra or lump-sum payment to see how much interest you've saved."
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}
