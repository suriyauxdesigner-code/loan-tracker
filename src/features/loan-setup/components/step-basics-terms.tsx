"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { InterestType } from "@/generated/prisma/enums";
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

export function StepBasicsTerms({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
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

      <Field label="Principal amount" error={errors.principalAmount?.message}>
        <Input
          {...register("principalAmount")}
          inputMode="decimal"
          placeholder="e.g. 2500000"
        />
      </Field>
      <Field label="Sanction date" error={errors.sanctionDate?.message}>
        <Input type="date" {...register("sanctionDate")} />
      </Field>
      <Field label="Interest rate (% p.a.)" error={errors.interestRate?.message}>
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
  );
}
