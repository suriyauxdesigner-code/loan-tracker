"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NAV } from "../nav-config";

interface PaletteItem {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
}

function flattenNav(): PaletteItem[] {
  const items: PaletteItem[] = [];
  for (const entry of NAV) {
    if (entry.kind === "leaf") {
      items.push({ key: entry.href, label: entry.label, href: entry.href, icon: entry.icon });
    } else {
      for (const item of entry.items) {
        items.push({
          key: item.href,
          label: item.label,
          sublabel: entry.label,
          href: item.href,
          icon: item.icon,
        });
      }
    }
  }
  return items;
}

export function CommandPalette({ loans }: { loans: { id: string; loanName: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<PaletteItem[]>(() => {
    const navItems = flattenNav();
    const loanItems: PaletteItem[] = loans.map((loan) => ({
      key: `loan-${loan.id}`,
      label: loan.loanName,
      sublabel: "Loan",
      href: `/finance/loans/${loan.id}`,
      icon: Landmark,
    }));
    return [...navItems, ...loanItems];
  }, [loans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q),
    );
  }, [items, query]);

  function openPalette() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  useEffect(() => {
    function handleGlobalKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (o) return false;
          setQuery("");
          setActiveIndex(0);
          return true;
        });
      }
    }
    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) navigateTo(item.href);
    }
  }

  return (
    <>
      <button
        onClick={openPalette}
        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex w-full max-w-sm items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-32 max-w-lg translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
          onKeyDown={handleKeydown}
        >
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <Search className="text-muted-foreground size-4" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Jump to a page or loan…"
              className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                Nothing matches &ldquo;{query}&rdquo;.
              </p>
            )}
            {filtered.map((item, i) => (
              <button
                key={item.key}
                onClick={() => navigateTo(item.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm",
                  i === activeIndex ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                <item.icon className="text-muted-foreground size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.sublabel && (
                  <span className="text-muted-foreground text-xs">{item.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
