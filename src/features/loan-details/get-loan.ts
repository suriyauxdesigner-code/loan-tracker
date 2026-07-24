import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server-client";

/** Auth-checked loan load, shared by the /loans/[id] layout and all three
 * pages (dashboard/details/schedule). Wrapped in React's cache() so
 * multiple calls within the same request (layout + page both need it)
 * dedupe into a single Prisma query instead of fetching three times. */
export const getLoanForUser = cache(async (id: string) => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) redirect("/login");

  const loan = await prisma.loan.findFirst({
    where: { id, user: { email: authUser.email } },
    include: {
      settings: true,
      disbursements: { orderBy: { date: "asc" } },
      payments: { orderBy: { date: "asc" } },
      importSnapshot: true,
    },
  });

  if (!loan || !loan.settings) notFound();

  return loan;
});

export type LoanForUser = Awaited<ReturnType<typeof getLoanForUser>>;
