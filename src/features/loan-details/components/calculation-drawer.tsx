"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SerializedEntry } from "../serialize";

const STEP_LABELS: Record<string, string> = {
  openingBalance: "Opening Balance",
  rateApplied: "Interest Rate",
  daysCounted: "Days Counted",
  interestAccrual: "Interest Accrued",
  capitalization: "Capitalized",
  emiSizing: "EMI",
  paymentApplication: "Payment Applied",
  closingBalance: "Closing Balance",
};

const NON_CURRENCY_STEPS = new Set(["rateApplied", "daysCounted"]);

export function CalculationDrawer({
  entry,
  currency,
  onOpenChange,
}: {
  entry: SerializedEntry | null;
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  const steps = entry
    ? [
        entry.breakdown.openingBalance,
        entry.breakdown.rateApplied,
        entry.breakdown.daysCounted,
        entry.breakdown.interestAccrual,
        entry.breakdown.capitalization,
        entry.breakdown.emiSizing,
        entry.breakdown.paymentApplication,
        entry.breakdown.closingBalance,
      ].filter((s): s is NonNullable<typeof s> => s != null)
    : [];

  return (
    <Sheet open={entry != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {entry && (
          <>
            <SheetHeader>
              <SheetTitle>Month {entry.monthIndex} — how this was calculated</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 overflow-y-auto px-4 pb-4">
              {steps.map((step) => (
                <div key={step.key} className="space-y-1 border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {STEP_LABELS[step.key] ?? step.key}
                    </span>
                    <span className="font-mono text-sm">
                      {NON_CURRENCY_STEPS.has(step.key)
                        ? step.key === "rateApplied"
                          ? `${step.value}%`
                          : step.value
                        : `${currency} ${step.value}`}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{step.formula}</p>
                  <p className="text-xs">{step.explanation}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
