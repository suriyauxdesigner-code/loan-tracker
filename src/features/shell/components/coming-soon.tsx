import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/** Shared body for every not-yet-built module/tab placeholder — one
 * component so these pages can't drift into divergent copies as more
 * modules get scaffolded ahead of being built. */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        className="max-w-md"
        action={
          <Badge variant="secondary" className="mt-1">
            Coming soon
          </Badge>
        }
      />
    </div>
  );
}
