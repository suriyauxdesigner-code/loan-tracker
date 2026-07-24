"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { MoratoriumInterestPayment } from "@/generated/prisma/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field } from "./field";
import type { LoanSetupValues } from "../schema";

export function StepMoratorium({
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

  const hasMoratorium = watch("hasMoratorium");
  const interestPayment = watch("moratoriumInterestPayment");

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="hasMoratorium"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            This loan has a moratorium / study period
          </label>
        )}
      />

      {hasMoratorium && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Study start date" error={errors.studyStartDate?.message}>
              <Input type="date" {...register("studyStartDate")} />
            </Field>
            <Field label="Study end date" error={errors.studyEndDate?.message}>
              <Input type="date" {...register("studyEndDate")} />
            </Field>
            <Field
              label="Moratorium start"
              error={errors.moratoriumStartDate?.message}
            >
              <Input type="date" {...register("moratoriumStartDate")} />
            </Field>
            <Field
              label="Moratorium end"
              error={errors.moratoriumEndDate?.message}
            >
              <Input type="date" {...register("moratoriumEndDate")} />
            </Field>
            <Field
              label="Course duration (months)"
              error={errors.courseDurationMonths?.message}
            >
              <Input type="number" {...register("courseDurationMonths")} />
            </Field>
            <Field
              label="Grace period (months)"
              error={errors.gracePeriodMonths?.message}
            >
              <Input type="number" {...register("gracePeriodMonths")} />
            </Field>
            <Field
              label="Total moratorium (months)"
              error={errors.totalMoratoriumMonths?.message}
            >
              <Input
                type="number"
                {...register("totalMoratoriumMonths")}
              />
            </Field>
          </div>

          <div className="space-y-1.5">
            <Label>Did you pay interest during the moratorium?</Label>
            <Controller
              control={control}
              name="moratoriumInterestPayment"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-4 pt-1"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={MoratoriumInterestPayment.NONE} />
                    No
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={MoratoriumInterestPayment.FULL} />
                    Yes, full interest
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem
                      value={MoratoriumInterestPayment.PARTIAL}
                    />
                    Yes, partial interest
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          {interestPayment === MoratoriumInterestPayment.PARTIAL && (
            <Field
              label="Average monthly interest payment"
              error={errors.moratoriumAvgMonthlyInterest?.message}
              className="max-w-xs"
            >
              <Input
                {...register("moratoriumAvgMonthlyInterest")}
                inputMode="decimal"
              />
            </Field>
          )}
        </>
      )}
    </div>
  );
}
