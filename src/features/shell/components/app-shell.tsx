import Link from "next/link";
import { getCurrentUserEmail } from "@/lib/auth/current-user";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const email = await getCurrentUserEmail();

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
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:justify-end lg:px-8">
          <MobileNav />
          <UserMenu email={email} />
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
