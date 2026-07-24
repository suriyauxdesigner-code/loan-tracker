"use server";

import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db/client";
import {
  generateSchedule,
  type DisbursementInput,
  type LoanEngineInput,
  type PaymentInput,
} from "@/lib/loan-engine";

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

  if (!loan.settings) {
    throw new Error(`Loan ${loanId} has no LoanSettings`);
  }

  const input: LoanEngineInput = {
    sanctionDate: loan.sanctionDate,
    interestRatePercent: new Decimal(loan.interestRate.toString()),
    calculationMethod: loan.settings.calculationMethod,
    compounding: loan.settings.compounding,
    dayCountConvention: loan.settings.dayCountConvention,
    paymentFrequency: loan.settings.paymentFrequency,
    prepaymentStrategy: loan.settings.prepaymentStrategy,
    emiType: loan.emiType,
    loanTenureMonths: loan.loanTenureMonths,
    repaymentTenureMonths: loan.repaymentTenureMonths,
    emiStartDate: loan.emiStartDate,

    hasMoratorium: loan.hasMoratorium,
    moratoriumStartDate: loan.moratoriumStartDate,
    moratoriumEndDate: loan.moratoriumEndDate,
    moratoriumInterestPayment: loan.moratoriumInterestPayment,
    moratoriumAvgMonthlyInterest: loan.moratoriumAvgMonthlyInterest
      ? new Decimal(loan.moratoriumAvgMonthlyInterest.toString())
      : null,
    capitalizeUnpaidInterest: loan.capitalizeUnpaidInterest,

    status: loan.status,

    disbursements: loan.disbursements.map(
      (d): DisbursementInput => ({
        date: d.date,
        amount: new Decimal(d.amount.toString()),
      }),
    ),
    payments: loan.payments.map(
      (p): PaymentInput => ({
        date: p.date,
        amount: new Decimal(p.amount.toString()),
        type: p.type,
        interestPaid: p.interestPaid ? new Decimal(p.interestPaid.toString()) : null,
        principalPaid: p.principalPaid
          ? new Decimal(p.principalPaid.toString())
          : null,
      }),
    ),
    importSnapshot: loan.importSnapshot
      ? {
          asOfDate: loan.importSnapshot.asOfDate,
          outstandingPrincipal: new Decimal(
            loan.importSnapshot.outstandingPrincipal.toString(),
          ),
          accruedInterest: new Decimal(
            loan.importSnapshot.accruedInterest.toString(),
          ),
        }
      : null,
  };

  const result = generateSchedule(input);

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
  });

  return result;
}
