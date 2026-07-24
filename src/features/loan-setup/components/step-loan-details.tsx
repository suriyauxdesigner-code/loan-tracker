"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  EmiType,
  InterestResetFrequency,
  InterestType,
  LoanStatus,
  LoanType,
} from "@/generated/prisma/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "./field";
import type { LoanSetupValues } from "../schema";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const LOAN_TYPE_LABELS: Record<string, string> = {
  [LoanType.EDUCATION]: "Education Loan",
  [LoanType.BIKE]: "Bike Loan",
  [LoanType.CAR]: "Car Loan",
  [LoanType.HOME]: "Home Loan",
  [LoanType.PERSONAL]: "Personal Loan",
  [LoanType.GOLD]: "Gold Loan",
  [LoanType.BUSINESS]: "Business Loan",
  [LoanType.OTHER]: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  [LoanStatus.NOT_STARTED]: "Not started",
  [LoanStatus.STUDY_PERIOD]: "Study period",
  [LoanStatus.MORATORIUM]: "Moratorium",
  [LoanStatus.EMI_STARTED]: "EMI started",
  [LoanStatus.CLOSED]: "Closed",
};

export function StepLoanDetails({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const interestType = watch("interestType");
  const isExistingLoan = watch("isExistingLoan");

  return (
    <div className="space-y-6">
      <Field label="Loan type" error={errors.loanType?.message}>
        <Controller
          control={control}
          name="loanType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LoanType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {LOAN_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Controller
        control={control}
        name="isExistingLoan"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            I&apos;m already repaying this loan
          </label>
        )}
      />

      {isExistingLoan && (
        <div className="bg-muted/40 grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <Field
            label="Current outstanding principal"
            error={errors.outstandingPrincipal?.message}
          >
            <Input {...register("outstandingPrincipal")} inputMode="decimal" />
          </Field>
          <Field
            label="Current accrued interest"
            error={errors.accruedInterest?.message}
          >
            <Input {...register("accruedInterest")} inputMode="decimal" />
          </Field>
          <Field
            label="Last interest posting date"
            error={errors.lastInterestPostingDate?.message}
          >
            <Input type="date" {...register("lastInterestPostingDate")} />
          </Field>
          <Field
            label="Last EMI paid date"
            error={errors.lastEmiPaidDate?.message}
          >
            <Input type="date" {...register("lastEmiPaidDate")} />
          </Field>
          <Field
            label="Total interest paid so far"
            error={errors.totalInterestPaidSoFar?.message}
          >
            <Input {...register("totalInterestPaidSoFar")} inputMode="decimal" />
          </Field>
          <Field
            label="Total principal paid so far"
            error={errors.totalPrincipalPaidSoFar?.message}
          >
            <Input {...register("totalPrincipalPaidSoFar")} inputMode="decimal" />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank name" error={errors.bankName?.message}>
          <Input {...register("bankName")} placeholder="e.g. HDFC Bank" />
        </Field>
        <Field label="Loan name" error={errors.loanName?.message}>
          <Input {...register("loanName")} placeholder="e.g. Education Loan" />
        </Field>
        <Field
          label="Loan account number"
          error={errors.loanAccountNumber?.message}
        >
          <Input {...register("loanAccountNumber")} placeholder="Optional" />
        </Field>
        <Field label="Currency" error={errors.currency?.message}>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Principal amount"
          error={errors.principalAmount?.message}
        >
          <Input
            {...register("principalAmount")}
            inputMode="decimal"
            placeholder="e.g. 2500000"
          />
        </Field>
        <Field label="Sanction date" error={errors.sanctionDate?.message}>
          <Input type="date" {...register("sanctionDate")} />
        </Field>
        <Field
          label="Loan approval date"
          error={errors.loanApprovalDate?.message}
        >
          <Input type="date" {...register("loanApprovalDate")} />
        </Field>
        <Field
          label="Interest rate (% p.a.)"
          error={errors.interestRate?.message}
        >
          <Input
            {...register("interestRate")}
            inputMode="decimal"
            placeholder="e.g. 8.5"
          />
        </Field>

        <Field label="Interest type">
          <Controller
            control={control}
            name="interestType"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4 pt-1"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={InterestType.FIXED} /> Fixed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={InterestType.FLOATING} /> Floating
                </label>
              </RadioGroup>
            )}
          />
        </Field>
        {interestType === InterestType.FLOATING && (
          <Field label="Interest reset frequency">
            <Controller
              control={control}
              name="interestResetFrequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InterestResetFrequency).map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        )}

        <Field label="EMI type">
          <Controller
            control={control}
            name="emiType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EmiType.STANDARD}>Standard EMI</SelectItem>
                  <SelectItem value={EmiType.INTEREST_ONLY}>
                    Interest only
                  </SelectItem>
                  <SelectItem value={EmiType.FLEXIBLE}>Flexible EMI</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Loan status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LoanStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Loan tenure (months)"
          error={errors.loanTenureMonths?.message}
        >
          <Input type="number" {...register("loanTenureMonths")} />
        </Field>
        <Field
          label="Repayment tenure (months)"
          error={errors.repaymentTenureMonths?.message}
        >
          <Input type="number" {...register("repaymentTenureMonths")} />
        </Field>
        <Field label="EMI start date" error={errors.emiStartDate?.message}>
          <Input type="date" {...register("emiStartDate")} />
        </Field>
        <Field
          label="Target closure date"
          error={errors.targetClosureDate?.message}
        >
          <Input type="date" {...register("targetClosureDate")} />
        </Field>
      </div>
    </div>
  );
}
