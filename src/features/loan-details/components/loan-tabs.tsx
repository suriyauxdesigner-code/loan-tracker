"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LoanTabs({ loanId }: { loanId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/loans/${loanId}`, label: "Dashboard" },
    { href: `/loans/${loanId}/details`, label: "Details" },
    { href: `/loans/${loanId}/schedule`, label: "EMI Schedule" },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive =
          tab.href === `/loans/${loanId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
