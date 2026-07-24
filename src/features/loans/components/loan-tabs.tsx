"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LoanTabs({ loanId }: { loanId: string }) {
  const pathname = usePathname();
  const base = `/finance/loans/${loanId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/details`, label: "Details" },
    { href: `${base}/repayment`, label: "Repayment Tracker", comingSoon: true },
    { href: `${base}/schedule`, label: "EMI Schedule" },
    { href: `${base}/forecast`, label: "Forecast" },
    { href: `${base}/documents`, label: "Documents", comingSoon: true },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const isActive = tab.href === base ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
            {tab.comingSoon && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                Soon
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
