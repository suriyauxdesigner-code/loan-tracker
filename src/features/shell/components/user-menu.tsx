"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="from-primary to-primary/60 text-primary-foreground ring-background flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold ring-2">
            {initials(email)}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="truncate font-normal">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
