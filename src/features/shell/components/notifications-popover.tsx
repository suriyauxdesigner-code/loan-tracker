"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Real UI affordance for a feature that doesn't exist yet — no
 * notification data model exists in the schema, so this is always an
 * honest empty state, never a fabricated unread count or badge. */
export function NotificationsPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BellOff className="text-muted-foreground size-6" />
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="text-muted-foreground text-xs">No notifications yet.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
