import Link from "next/link";
import { getCurrentUserEmail } from "@/lib/auth/current-user";
import { getLoanNamesForUser } from "@/features/loans/get-loan";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { NotificationsPopover } from "./notifications-popover";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [email, loans] = await Promise.all([getCurrentUserEmail(), getLoanNamesForUser()]);

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-card hidden w-64 shrink-0 flex-col border-r lg:flex">
        <Link href="/" className="flex items-center gap-2 px-4 py-4">
          <span className="bg-primary inline-block size-2.5 rounded-full" />
          <span className="text-base font-semibold tracking-tight">FinanceOS</span>
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md lg:px-8">
          <MobileNav />
          <div className="flex-1 lg:max-w-sm">
            <CommandPalette loans={loans} />
          </div>
          <div className="flex items-center gap-1">
            <NotificationsPopover />
            <ThemeToggle />
            <UserMenu email={email} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
