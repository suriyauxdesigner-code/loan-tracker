import { Decimal } from "decimal.js";
import type {
  CompoundingFrequency,
  DayCountConvention,
  EmiType,
  InterestCalculationMethod,
  InterestType,
  LoanStatus,
  MoratoriumInterestPayment,
  PaymentFrequency,
  PaymentType,
  PrepaymentStrategy,
} from "@/generated/prisma/enums";
import type {
  DisbursementInput,
  LoanEngineInput,
  PaymentInput,
} from "@/lib/loan-engine";

/** Shape returned by `prisma.loan.findUniqueOrThrow({ include: { settings,
 * disbursements, payments, importSnapshot } })` — kept as a plain interface
 * (rather than fighting Prisma's generic payload types) since this is the
 * one place both the write path (regenerateSchedule) and the read-only
 * Loan Details page need to agree on. */
export interface LoanWithEngineRelations {
  sanctionDate: Date;
  interestRate: Decimal;
  interestType: InterestType;
  emiType: EmiType;
  loanTenureMonths: number;
  repaymentTenureMonths: number;
  emiStartDate: Date | null;
  hasMoratorium: boolean;
  moratoriumStartDate: Date | null;
  moratoriumEndDate: Date | null;
  moratoriumInterestPayment: MoratoriumInterestPayment;
  moratoriumAvgMonthlyInterest: Decimal | null;
  capitalizeUnpaidInterest: boolean;
  status: LoanStatus;
  settings: {
    calculationMethod: InterestCalculationMethod;
    compounding: CompoundingFrequency;
    dayCountConvention: DayCountConvention;
    paymentFrequency: PaymentFrequency;
    prepaymentStrategy: PrepaymentStrategy;
  } | null;
  disbursements: { date: Date; amount: Decimal }[];
  payments: {
    date: Date;
    amount: Decimal;
    type: PaymentType;
    interestPaid: Decimal | null;
    principalPaid: Decimal | null;
  }[];
  importSnapshot: {
    asOfDate: Date;
    outstandingPrincipal: Decimal;
    accruedInterest: Decimal;
  } | null;
}

/** The single mapping from stored Loan data to the pure engine's input
 * shape — used by both regenerateSchedule (writes AmortizationEntry) and
 * the read-only Loan Details page (computes the explanation/audit data
 * fresh), so the two can never disagree on how inputs get built. */
export function mapLoanToEngineInput(loan: LoanWithEngineRelations): LoanEngineInput {
  if (!loan.settings) {
    throw new Error("Loan has no LoanSettings");
  }

  return {
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
}
