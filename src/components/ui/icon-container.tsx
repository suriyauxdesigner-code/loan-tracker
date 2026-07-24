import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconTone = "violet" | "emerald" | "amber" | "sky" | "rose" | "slate";

const TONE_CLASSES: Record<IconTone, string> = {
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  rose: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  slate: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
};

export function IconContainer({
  icon: Icon,
  tone = "violet",
  className,
  size = "default",
}: {
  icon: LucideIcon;
  tone?: IconTone;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        size === "sm" && "size-7",
        size === "default" && "size-9",
        size === "lg" && "size-12 rounded-xl",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className={cn(size === "lg" ? "size-6" : size === "sm" ? "size-3.5" : "size-4")} />
    </div>
  );
}
