"use server";

import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server-client";
import { loanSetupSchema, type LoanSetupValues } from "./schema";

function toDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

function toInt(value: string | undefined) {
  return value ? Number(value) : null;
}

export async function createLoan(values: LoanSetupValues) {
  const parsed = loanSetupSchema.parse(values);

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

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        userId: user.id,
        bankName: parsed.bankName,
        loanName: parsed.loanName,
        loanAccountNumber: parsed.loanAccountNumber || null,
        currency: parsed.currency,

        principalAmount: parsed.principalAmount,
        sanctionDate: new Date(parsed.sanctionDate),
        interestRate: parsed.interestRate,
        interestType: parsed.interestType,
        loanTenureMonths: Number(parsed.loanTenureMonths),
        repaymentTenureMonths: Number(parsed.repaymentTenureMonths),
        emiStartDate: toDate(parsed.emiStartDate),
        targetClosureDate: toDate(parsed.targetClosureDate),

        hasMoratorium: parsed.hasMoratorium,
        studyStartDate: toDate(parsed.studyStartDate),
        studyEndDate: toDate(parsed.studyEndDate),
        moratoriumStartDate: toDate(parsed.moratoriumStartDate),
        moratoriumEndDate: toDate(parsed.moratoriumEndDate),
        courseDurationMonths: toInt(parsed.courseDurationMonths),
        gracePeriodMonths: toInt(parsed.gracePeriodMonths),
        totalMoratoriumMonths: toInt(parsed.totalMoratoriumMonths),
        moratoriumInterestPayment: parsed.moratoriumInterestPayment,
        moratoriumAvgMonthlyInterest:
          parsed.moratoriumAvgMonthlyInterest || null,

        settings: {
          create: {
            compounding: parsed.compounding,
            calculationMethod: parsed.calculationMethod,
            dayCountConvention: parsed.dayCountConvention,
            emiReminder: parsed.emiReminder,
            interestReminder: parsed.interestReminder,
            monthlySummary: parsed.monthlySummary,
            emailNotifications: parsed.emailNotifications,
          },
        },
      },
    });

    if (parsed.disbursements.length > 0) {
      await tx.disbursement.createMany({
        data: parsed.disbursements.map((d) => ({
          loanId: loan.id,
          date: new Date(d.date),
          amount: d.amount,
          remarks: d.remarks || null,
        })),
      });
    }

    if (parsed.existingPayments.length > 0) {
      await tx.payment.createMany({
        data: parsed.existingPayments.map((p) => ({
          loanId: loan.id,
          date: new Date(p.date),
          amount: p.amount,
          type: p.type,
          interestPaid: p.interestPaid || null,
          principalPaid: p.principalPaid || null,
          remarks: p.remarks || null,
        })),
      });
    }

    return loan;
  });
}
