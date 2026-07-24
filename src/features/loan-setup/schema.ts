import { z } from "zod";
import {
  EmiType,
  InterestResetFrequency,
  InterestType,
  LoanStatus,
  LoanType,
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
  // Loan Details
  loanType: z.enum([
    LoanType.EDUCATION,
    LoanType.BIKE,
    LoanType.CAR,
    LoanType.HOME,
    LoanType.PERSONAL,
    LoanType.GOLD,
    LoanType.BUSINESS,
    LoanType.OTHER,
  ]),
  bankName: z.string().min(1, "Required"),
  loanName: z.string().min(1, "Required"),
  loanAccountNumber: z.string().optional(),
  currency: z.string().min(1),

  principalAmount: decimalString(0.01),
  sanctionDate: z.string().min(1, "Required"),
  loanApprovalDate: optionalDateString,
  interestRate: decimalString(0),
  interestType: z.enum([InterestType.FIXED, InterestType.FLOATING]),
  interestResetFrequency: z
    .enum([
      InterestResetFrequency.MONTHLY,
      InterestResetFrequency.QUARTERLY,
      InterestResetFrequency.HALF_YEARLY,
      InterestResetFrequency.YEARLY,
    ])
    .optional(),
  emiType: z.enum([EmiType.STANDARD, EmiType.INTEREST_ONLY, EmiType.FLEXIBLE]),
  loanTenureMonths: intString,
  repaymentTenureMonths: intString,
  emiStartDate: optionalDateString,
  targetClosureDate: optionalDateString,
  status: z.enum([
    LoanStatus.NOT_STARTED,
    LoanStatus.STUDY_PERIOD,
    LoanStatus.MORATORIUM,
    LoanStatus.EMI_STARTED,
    LoanStatus.CLOSED,
  ]),

  // Existing-loan toggle (inline in Step 1) + snapshot, used once to seed
  // schedule generation for a loan that's already partway through repayment.
  isExistingLoan: z.boolean(),
  outstandingPrincipal: optionalDecimalString,
  accruedInterest: optionalDecimalString,
  lastInterestPostingDate: optionalDateString,
  lastEmiPaidDate: optionalDateString,
  totalInterestPaidSoFar: optionalDecimalString,
  totalPrincipalPaidSoFar: optionalDecimalString,

  // Study Period & Moratorium (Education) / Construction Phase (Home) —
  // same fields reused for both, only the step's copy differs.
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
  capitalizeUnpaidInterest: z.boolean(),

  // Disbursements & previous payments
  disbursements: z.array(disbursementSchema),
  existingPayments: z.array(existingPaymentSchema),
});

export type LoanSetupValues = z.infer<typeof loanSetupSchema>;

export const loanSetupDefaults: LoanSetupValues = {
  loanType: LoanType.EDUCATION,
  bankName: "",
  loanName: "",
  loanAccountNumber: "",
  currency: "INR",

  principalAmount: "",
  sanctionDate: "",
  loanApprovalDate: "",
  interestRate: "",
  interestType: InterestType.FIXED,
  interestResetFrequency: undefined,
  emiType: EmiType.STANDARD,
  loanTenureMonths: "60",
  repaymentTenureMonths: "60",
  emiStartDate: "",
  targetClosureDate: "",
  status: LoanStatus.NOT_STARTED,

  isExistingLoan: false,
  outstandingPrincipal: "",
  accruedInterest: "",
  lastInterestPostingDate: "",
  lastEmiPaidDate: "",
  totalInterestPaidSoFar: "",
  totalPrincipalPaidSoFar: "",

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
  capitalizeUnpaidInterest: true,

  disbursements: [{ date: "", amount: "", remarks: "" }],
  existingPayments: [],
};

export type WizardStepKey =
  | "details"
  | "previous-payments"
  | "moratorium"
  | "disbursement"
  | "review";

const STEP_FIELD_MAP: Record<
  Exclude<WizardStepKey, "review">,
  readonly (keyof LoanSetupValues)[]
> = {
  details: [
    "loanType",
    "bankName",
    "loanName",
    "loanAccountNumber",
    "currency",
    "principalAmount",
    "sanctionDate",
    "loanApprovalDate",
    "interestRate",
    "interestType",
    "interestResetFrequency",
    "emiType",
    "loanTenureMonths",
    "repaymentTenureMonths",
    "emiStartDate",
    "targetClosureDate",
    "status",
    "isExistingLoan",
    "outstandingPrincipal",
    "accruedInterest",
    "lastInterestPostingDate",
    "lastEmiPaidDate",
    "totalInterestPaidSoFar",
    "totalPrincipalPaidSoFar",
  ],
  "previous-payments": ["existingPayments"],
  moratorium: [
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
    "capitalizeUnpaidInterest",
  ],
  disbursement: ["disbursements"],
};

export function getStepFields(step: WizardStepKey): (keyof LoanSetupValues)[] {
  if (step === "review") return [];
  return [...STEP_FIELD_MAP[step]];
}
