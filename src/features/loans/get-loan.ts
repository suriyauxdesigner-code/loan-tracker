import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { getCurrentUserEmail } from "@/lib/auth/current-user";

const LOAN_INCLUDE = {
  settings: true,
  disbursements: { orderBy: { date: "asc" as const } },
  payments: { orderBy: { date: "asc" as const } },
  importSnapshot: true,
  _count: { select: { amortizationEntries: true } },
};

/** Auth-checked loan load, shared by the loan workspace layout and all of
 * its tabs. Wrapped in React's cache() so multiple calls within the same
 * request (layout + page both need it) dedupe into a single Prisma query
 * instead of fetching multiple times. */
export const getLoanForUser = cache(async (id: string) => {
  const email = await getCurrentUserEmail();

  const loan = await prisma.loan.findFirst({
    where: { id, user: { email } },
    include: LOAN_INCLUDE,
  });

  if (!loan || !loan.settings) notFound();

  return loan;
});

export type LoanForUser = Awaited<ReturnType<typeof getLoanForUser>>;

/** All of the current user's loans, same include shape as getLoanForUser
 * — a single findMany, not a loop over per-id loads, so the Financial
 * Overview aggregation doesn't do N Prisma round-trips for N loans. */
export const getLoansForUser = cache(async () => {
  const email = await getCurrentUserEmail();

  return prisma.loan.findMany({
    where: { user: { email } },
    include: LOAN_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
});

/** Element type of getLoansForUser() — unlike LoanForUser, `settings` is
 * typed nullable here since findMany can't narrow it away like the
 * single-loan notFound() check does. mapLoanToEngineInput already handles
 * a null settings at runtime, so this is the correct type to pass around
 * for any multi-loan aggregation. */
export type LoanWithRelations = Awaited<ReturnType<typeof getLoansForUser>>[number];
