"use server";

import { prisma } from "@/lib/db/client";
import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "./map-to-engine-input";

/** Regenerates the full amortization schedule for a loan from scratch —
 * the single source of truth every other screen reads from. Full-rewrite,
 * not incremental: at this app's scale (one person, a handful of loans)
 * that's simpler and correct. Called right after loan creation, and later
 * by Payment Tracker after every recorded payment. */
export async function regenerateSchedule(loanId: string) {
  const loan = await prisma.loan.findUniqueOrThrow({
    where: { id: loanId },
    include: {
      settings: true,
      disbursements: true,
      payments: true,
      importSnapshot: true,
    },
  });

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);

  const today = new Date();
  const finalEntry = result.entries[result.entries.length - 1];
  const shouldCloseLoan =
    result.converged &&
    result.closureReason != null &&
    finalEntry != null &&
    finalEntry.dueDate <= today;

  await prisma.$transaction(async (tx) => {
    await tx.amortizationEntry.deleteMany({ where: { loanId } });
    if (result.entries.length > 0) {
      await tx.amortizationEntry.createMany({
        data: result.entries.map((e) => ({
          loanId,
          monthIndex: e.monthIndex,
          dueDate: e.dueDate,
          openingBalance: e.openingBalance.toFixed(2),
          interestAccrued: e.interestAccrued.toFixed(2),
          interestPaid: e.interestPaid.toFixed(2),
          principalPaid: e.principalPaid.toFixed(2),
          emiAmount: e.emiAmount.toFixed(2),
          extraPayment: e.extraPayment.toFixed(2),
          capitalizedInterest: e.capitalizedInterest.toFixed(2),
          closingBalance: e.closingBalance.toFixed(2),
          status: e.status,
        })),
      });
    }
    if (shouldCloseLoan && loan.status !== "CLOSED") {
      await tx.loan.update({ where: { id: loanId }, data: { status: "CLOSED" } });
    }
  });

  return result;
}
