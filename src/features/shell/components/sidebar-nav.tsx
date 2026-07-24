"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NAV, type NavLeaf } from "../nav-config";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  layoutId,
}: {
  item: NavLeaf;
  pathname: string;
  layoutId: string;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="bg-primary/10 absolute inset-0 rounded-md"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative size-4 shrink-0" />
      <span className="relative flex-1 truncate">{item.label}</span>
      {item.comingSoon && (
        <Badge variant="secondary" className="relative px-1.5 py-0 text-[10px] font-normal">
          Soon
        </Badge>
      )}
    </Link>
  );
}

export function SidebarNav({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const layoutId = `sidebar-active-${variant}`;

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {NAV.map((entry, i) => {
        if (entry.kind === "leaf") {
          if (entry.label === "Settings") return null;
          return <NavLink key={entry.href} item={entry} pathname={pathname} layoutId={layoutId} />;
        }
        return (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="text-muted-foreground flex items-center gap-2 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase">
              <entry.icon className="size-3.5" />
              {entry.label}
            </div>
            {entry.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} layoutId={layoutId} />
            ))}
          </div>
        );
      })}

      <div className="mt-auto">
        {NAV.filter((e) => e.kind === "leaf" && e.label === "Settings").map((entry) =>
          entry.kind === "leaf" ? (
            <NavLink key={entry.href} item={entry} pathname={pathname} layoutId={layoutId} />
          ) : null,
        )}
      </div>
    </nav>
  );
}
