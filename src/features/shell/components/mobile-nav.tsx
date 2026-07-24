"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b py-3">
          <SheetTitle>FinanceOS</SheetTitle>
        </SheetHeader>
        <SidebarNav variant="mobile" />
      </SheetContent>
    </Sheet>
  );
}
