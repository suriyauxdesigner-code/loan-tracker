import { z } from "zod";
import {
  CompoundingFrequency,
  DayCountConvention,
  InterestCalculationMethod,
  InterestType,
  MoratoriumInterestPayment,
  PaymentType,
} from "@/generated/prisma/enums";

const decimalString = (min = 0) =>
  z
    .string()
    .min(1, "Required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= min, {
      message: `Must be a number ${min > 0 ? `greater than ${min}` : "or more"}`,
    });

const optionalDecimalString = z
  .string()
  .refine((v) => v === "" || !Number.isNaN(Number(v)), "Must be a number")
  .optional();

const intString = z
  .string()
  .min(1, "Required")
  .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Must be a whole number");

const optionalIntString = z
  .string()
  .refine((v) => v === "" || /^\d+$/.test(v), "Must be a whole number")
  .optional();

const optionalDateString = z.string().optional();

export const disbursementSchema = z.object({
  date: z.string().min(1, "Required"),
  amount: decimalString(0.01),
  remarks: z.string().optional(),
});

export const existingPaymentSchema = z.object({
  date: z.string().min(1, "Required"),
  amount: decimalString(0.01),
  type: z.enum([
    PaymentType.EMI,
    PaymentType.EXTRA,
    PaymentType.INTEREST_ONLY,
    PaymentType.PRINCIPAL_ONLY,
    PaymentType.LUMP_SUM,
  ]),
  interestPaid: optionalDecimalString,
  principalPaid: optionalDecimalString,
  remarks: z.string().optional(),
});

export const loanSetupSchema = z.object({
  // Basics
  bankName: z.string().min(1, "Required"),
  loanName: z.string().min(1, "Required"),
  loanAccountNumber: z.string().optional(),
  currency: z.string().min(1),

  // Terms
  principalAmount: decimalString(0.01),
  sanctionDate: z.string().min(1, "Required"),
  interestRate: decimalString(0),
  interestType: z.enum([InterestType.FIXED, InterestType.FLOATING]),
  loanTenureMonths: intString,
  repaymentTenureMonths: intString,
  emiStartDate: optionalDateString,
  targetClosureDate: optionalDateString,

  // Moratorium
  hasMoratorium: z.boolean(),
  studyStartDate: optionalDateString,
  studyEndDate: optionalDateString,
  moratoriumStartDate: optionalDateString,
  moratoriumEndDate: optionalDateString,
  courseDurationMonths: optionalIntString,
  gracePeriodMonths: optionalIntString,
  totalMoratoriumMonths: optionalIntString,
  moratoriumInterestPayment: z.enum([
    MoratoriumInterestPayment.NONE,
    MoratoriumInterestPayment.FULL,
    MoratoriumInterestPayment.PARTIAL,
  ]),
  moratoriumAvgMonthlyInterest: optionalDecimalString,

  // Disbursements & existing payments
  disbursements: z.array(disbursementSchema),
  existingPayments: z.array(existingPaymentSchema),

  // Settings
  compounding: z.enum([
    CompoundingFrequency.DAILY,
    CompoundingFrequency.MONTHLY,
    CompoundingFrequency.QUARTERLY,
    CompoundingFrequency.YEARLY,
  ]),
  calculationMethod: z.enum([
    InterestCalculationMethod.SIMPLE,
    InterestCalculationMethod.COMPOUND,
    InterestCalculationMethod.REDUCING_BALANCE,
  ]),
  dayCountConvention: z.enum([
    DayCountConvention.DAYS_365,
    DayCountConvention.DAYS_360,
  ]),

  // Notifications
  emiReminder: z.boolean(),
  interestReminder: z.boolean(),
  monthlySummary: z.boolean(),
  emailNotifications: z.boolean(),
});

export type LoanSetupValues = z.infer<typeof loanSetupSchema>;

export const loanSetupDefaults: LoanSetupValues = {
  bankName: "",
  loanName: "",
  loanAccountNumber: "",
  currency: "INR",

  principalAmount: "",
  sanctionDate: "",
  interestRate: "",
  interestType: InterestType.FIXED,
  loanTenureMonths: "60",
  repaymentTenureMonths: "60",
  emiStartDate: "",
  targetClosureDate: "",

  hasMoratorium: false,
  studyStartDate: "",
  studyEndDate: "",
  moratoriumStartDate: "",
  moratoriumEndDate: "",
  courseDurationMonths: "",
  gracePeriodMonths: "",
  totalMoratoriumMonths: "",
  moratoriumInterestPayment: MoratoriumInterestPayment.NONE,
  moratoriumAvgMonthlyInterest: "",

  disbursements: [{ date: "", amount: "", remarks: "" }],
  existingPayments: [],

  compounding: CompoundingFrequency.MONTHLY,
  calculationMethod: InterestCalculationMethod.REDUCING_BALANCE,
  dayCountConvention: DayCountConvention.DAYS_365,

  emiReminder: true,
  interestReminder: true,
  monthlySummary: true,
  emailNotifications: false,
};

export const STEP_FIELDS = [
  [
    "bankName",
    "loanName",
    "loanAccountNumber",
    "currency",
    "principalAmount",
    "sanctionDate",
    "interestRate",
    "interestType",
    "loanTenureMonths",
    "repaymentTenureMonths",
    "emiStartDate",
    "targetClosureDate",
  ],
  [
    "hasMoratorium",
    "studyStartDate",
    "studyEndDate",
    "moratoriumStartDate",
    "moratoriumEndDate",
    "courseDurationMonths",
    "gracePeriodMonths",
    "totalMoratoriumMonths",
    "moratoriumInterestPayment",
    "moratoriumAvgMonthlyInterest",
  ],
  ["disbursements", "existingPayments"],
  [
    "compounding",
    "calculationMethod",
    "dayCountConvention",
    "emiReminder",
    "interestReminder",
    "monthlySummary",
    "emailNotifications",
  ],
] as const satisfies readonly (keyof LoanSetupValues)[][];
