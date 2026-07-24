"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import {
  CompoundingFrequency,
  DayCountConvention,
  InterestCalculationMethod,
} from "@/generated/prisma/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

const CALC_METHODS: { value: string; label: string }[] = [
  { value: InterestCalculationMethod.REDUCING_BALANCE, label: "Reducing balance" },
  { value: InterestCalculationMethod.SIMPLE, label: "Simple" },
  { value: InterestCalculationMethod.COMPOUND, label: "Compound" },
];

const COMPOUNDING: { value: string; label: string }[] = [
  { value: CompoundingFrequency.MONTHLY, label: "Monthly" },
  { value: CompoundingFrequency.DAILY, label: "Daily" },
  { value: CompoundingFrequency.QUARTERLY, label: "Quarterly" },
  { value: CompoundingFrequency.YEARLY, label: "Yearly" },
];

export function StepSettingsReview({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const { control, watch } = form;
  const values = watch();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Compounding">
          <Controller
            control={control}
            name="compounding"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPOUNDING.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Interest calculation method">
          <Controller
            control={control}
            name="calculationMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALC_METHODS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Day count convention" className="sm:col-span-2">
          <Controller
            control={control}
            name="dayCountConvention"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={DayCountConvention.DAYS_365} /> 365
                  days/year
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={DayCountConvention.DAYS_360} /> 360
                  days/year
                </label>
              </RadioGroup>
            )}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <Label>Notifications</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["emiReminder", "EMI reminder"],
              ["interestReminder", "Interest reminder"],
              ["monthlySummary", "Monthly summary"],
              ["emailNotifications", "Email notifications"],
            ] as const
          ).map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  {label}
                </label>
              )}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <ReviewRow label="Loan" value={`${values.loanName} — ${values.bankName}`} />
          <ReviewRow
            label="Principal"
            value={`${values.currency} ${values.principalAmount || "—"}`}
          />
          <ReviewRow label="Interest rate" value={`${values.interestRate || "—"}% (${values.interestType})`} />
          <ReviewRow
            label="Tenure"
            value={`${values.loanTenureMonths} months`}
          />
          <ReviewRow
            label="Moratorium"
            value={values.hasMoratorium ? "Yes" : "No"}
          />
          <ReviewRow
            label="Disbursements"
            value={`${values.disbursements.length} entr${values.disbursements.length === 1 ? "y" : "ies"}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-start">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
