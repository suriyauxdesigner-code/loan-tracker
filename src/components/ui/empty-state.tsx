import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
        <Icon className="text-primary size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground max-w-sm text-sm text-balance">{description}</p>
      </div>
      {action}
    </div>
  );
}
