"use server";

import { LoanType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server-client";
import { regenerateSchedule } from "@/features/loan-engine/actions";
import { loanSetupSchema, type LoanSetupValues } from "./schema";

function toDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

function toInt(value: string | undefined) {
  return value ? Number(value) : null;
}

const SUPPORTS_MORATORIUM: readonly string[] = [LoanType.EDUCATION, LoanType.HOME];

export async function createLoan(values: LoanSetupValues) {
  const parsed = loanSetupSchema.parse(values);
  const hasMoratorium =
    parsed.hasMoratorium && SUPPORTS_MORATORIUM.includes(parsed.loanType);

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    throw new Error("Not signed in");
  }

  const user = await prisma.user.upsert({
    where: { email: authUser.email },
    update: {},
    create: { email: authUser.email },
  });

  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.loan.create({
      data: {
        userId: user.id,
        loanType: parsed.loanType,
        bankName: parsed.bankName,
        loanName: parsed.loanName,
        loanAccountNumber: parsed.loanAccountNumber || null,
        currency: parsed.currency,

        principalAmount: parsed.principalAmount,
        sanctionDate: new Date(parsed.sanctionDate),
        loanApprovalDate: toDate(parsed.loanApprovalDate),
        interestRate: parsed.interestRate,
        interestType: parsed.interestType,
        interestResetFrequency:
          parsed.interestType === "FLOATING"
            ? (parsed.interestResetFrequency ?? null)
            : null,
        emiType: parsed.emiType,
        loanTenureMonths: Number(parsed.loanTenureMonths),
        repaymentTenureMonths: Number(parsed.repaymentTenureMonths),
        emiStartDate: toDate(parsed.emiStartDate),
        targetClosureDate: toDate(parsed.targetClosureDate),
        status: parsed.status,

        // Never persisted for loan types that don't support a
        // moratorium/construction phase, regardless of stale form state.
        hasMoratorium,
        studyStartDate: hasMoratorium ? toDate(parsed.studyStartDate) : null,
        studyEndDate: hasMoratorium ? toDate(parsed.studyEndDate) : null,
        moratoriumStartDate: hasMoratorium
          ? toDate(parsed.moratoriumStartDate)
          : null,
        moratoriumEndDate: hasMoratorium
          ? toDate(parsed.moratoriumEndDate)
          : null,
        courseDurationMonths: hasMoratorium
          ? toInt(parsed.courseDurationMonths)
          : null,
        gracePeriodMonths: hasMoratorium ? toInt(parsed.gracePeriodMonths) : null,
        totalMoratoriumMonths: hasMoratorium
          ? toInt(parsed.totalMoratoriumMonths)
          : null,
        moratoriumInterestPayment: hasMoratorium
          ? parsed.moratoriumInterestPayment
          : "NONE",
        moratoriumAvgMonthlyInterest: hasMoratorium
          ? parsed.moratoriumAvgMonthlyInterest || null
          : null,
        capitalizeUnpaidInterest: parsed.capitalizeUnpaidInterest,

        settings: {
          // Loan Configuration isn't a wizard step — smart defaults,
          // editable later from loan settings.
          create: {
            compounding: "MONTHLY",
            calculationMethod: "REDUCING_BALANCE",
            dayCountConvention: "DAYS_365",
            paymentFrequency: "MONTHLY",
            prepaymentStrategy: "REDUCE_TENURE",
            autoAccrueInterestDaily: true,
            autoCapitalizeMonthly: true,
            autoGenerateEmiMonthly: true,
            autoRefreshDashboard: true,
            emiReminder: true,
            interestReminder: true,
            monthlySummary: true,
            emailNotifications: false,
          },
        },

        ...(parsed.isExistingLoan && parsed.outstandingPrincipal
          ? {
              importSnapshot: {
                create: {
                  asOfDate:
                    toDate(parsed.lastInterestPostingDate) ?? new Date(),
                  outstandingPrincipal: parsed.outstandingPrincipal,
                  accruedInterest: parsed.accruedInterest || 0,
                  lastInterestPostingDate: toDate(
                    parsed.lastInterestPostingDate,
                  ),
                  lastEmiPaidDate: toDate(parsed.lastEmiPaidDate),
                  totalInterestPaidSoFar: parsed.totalInterestPaidSoFar || 0,
                  totalPrincipalPaidSoFar: parsed.totalPrincipalPaidSoFar || 0,
                },
              },
            }
          : {}),
      },
    });

    // Personal loans skip the Disbursement step — the engine only ever
    // reads real Disbursement rows, so seed one implicit full-principal
    // disbursement rather than fabricating balance from principalAmount.
    const disbursements =
      parsed.loanType === LoanType.PERSONAL
        ? [{ date: parsed.sanctionDate, amount: parsed.principalAmount, remarks: null as string | null }]
        : parsed.disbursements;

    if (disbursements.length > 0) {
      await tx.disbursement.createMany({
        data: disbursements.map((d) => ({
          loanId: created.id,
          date: new Date(d.date),
          amount: d.amount,
          remarks: d.remarks || null,
        })),
      });
    }

    if (parsed.existingPayments.length > 0) {
      await tx.payment.createMany({
        data: parsed.existingPayments.map((p) => ({
          loanId: created.id,
          date: new Date(p.date),
          amount: p.amount,
          type: p.type,
          interestPaid: p.interestPaid || null,
          principalPaid: p.principalPaid || null,
          remarks: p.remarks || null,
        })),
      });
    }

    return created;
  });

  await regenerateSchedule(loan.id);

  return loan;
}
