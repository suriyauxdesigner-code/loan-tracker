"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NAV, type NavLeaf } from "../nav-config";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.comingSoon && (
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
          Soon
        </Badge>
      )}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {NAV.map((entry, i) => {
        if (entry.kind === "leaf") {
          if (entry.label === "Settings") return null;
          return <NavLink key={entry.href} item={entry} pathname={pathname} />;
        }
        return (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="text-muted-foreground flex items-center gap-2 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase">
              <entry.icon className="size-3.5" />
              {entry.label}
            </div>
            {entry.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        );
      })}

      <div className="mt-auto">
        {NAV.filter((e) => e.kind === "leaf" && e.label === "Settings").map((entry) =>
          entry.kind === "leaf" ? <NavLink key={entry.href} item={entry} pathname={pathname} /> : null,
        )}
      </div>
    </nav>
  );
}
