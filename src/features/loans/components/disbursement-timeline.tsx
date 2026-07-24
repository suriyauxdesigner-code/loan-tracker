import { CircleDollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export interface DisbursementRow {
  id: string;
  date: Date;
  amount: string;
  remarks: string | null;
  runningTotal: string;
}

export function DisbursementTimeline({
  rows,
  currency,
}: {
  rows: DisbursementRow[];
  currency: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="No disbursements yet"
        description="Disbursements will appear here as they're recorded against this loan."
      />
    );
  }

  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => (
        <li key={row.id} className="relative flex gap-3 pb-6 last:pb-0">
          {i < rows.length - 1 && (
            <span className="bg-border absolute top-3 left-[5px] h-full w-px" />
          )}
          <span className="bg-primary relative top-1.5 size-2.5 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <div>
              <p className="text-sm font-medium">
                {currency} {row.amount}
              </p>
              <p className="text-muted-foreground text-xs">
                {fmtDate(row.date)}
                {row.remarks ? ` · ${row.remarks}` : ""}
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              Running total: {currency} {row.runningTotal}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
