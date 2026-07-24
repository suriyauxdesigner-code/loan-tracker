"use client";

import { useEffect } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { addMonths, differenceInCalendarMonths, format, parseISO } from "date-fns";
import { MoratoriumInterestPayment } from "@/generated/prisma/enums";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field } from "./field";
import type { LoanSetupValues } from "../schema";

const COPY = {
  education: {
    toggle: "This loan has a study period / moratorium",
    startLabel: "Study start date",
    endLabel: "Study end date",
    graceLabel: "Grace period after course ends (months)",
    interestQuestion: "Did you pay interest during the moratorium?",
  },
  home: {
    toggle: "This loan has a construction phase",
    startLabel: "Construction start date",
    endLabel: "Construction end date",
    graceLabel: "Grace period after possession (months)",
    interestQuestion: "Did you pay interest during construction?",
  },
} as const;

function readOnlyValue(value: string) {
  return (
    <div className="border-input bg-muted/40 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
      {value || "—"}
    </div>
  );
}

export function StepMoratorium({
  form,
  variant = "education",
}: {
  form: UseFormReturn<LoanSetupValues>;
  variant?: "education" | "home";
}) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const hasMoratorium = watch("hasMoratorium");
  const interestPayment = watch("moratoriumInterestPayment");
  const studyStartDate = watch("studyStartDate");
  const studyEndDate = watch("studyEndDate");
  const gracePeriodMonths = watch("gracePeriodMonths");
  const courseDurationMonths = watch("courseDurationMonths");
  const moratoriumStartDate = watch("moratoriumStartDate");
  const moratoriumEndDate = watch("moratoriumEndDate");
  const totalMoratoriumMonths = watch("totalMoratoriumMonths");

  const copy = COPY[variant];

  // Smart calculation: derive course duration / moratorium start-end /
  // total months from the study dates + grace period, shown read-only.
  useEffect(() => {
    if (!studyStartDate || !studyEndDate) return;
    const start = parseISO(studyStartDate);
    const end = parseISO(studyEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const duration = Math.max(0, differenceInCalendarMonths(end, start));
    const grace = Number(gracePeriodMonths) || 0;
    const moratoriumEnd = addMonths(end, grace);

    setValue("courseDurationMonths", String(duration));
    setValue("moratoriumStartDate", format(start, "yyyy-MM-dd"));
    setValue("moratoriumEndDate", format(moratoriumEnd, "yyyy-MM-dd"));
    setValue("totalMoratoriumMonths", String(duration + grace));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyStartDate, studyEndDate, gracePeriodMonths]);

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="hasMoratorium"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            {copy.toggle}
          </label>
        )}
      />

      {hasMoratorium && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={copy.startLabel} error={errors.studyStartDate?.message}>
              <Input type="date" {...register("studyStartDate")} />
            </Field>
            <Field label={copy.endLabel} error={errors.studyEndDate?.message}>
              <Input type="date" {...register("studyEndDate")} />
            </Field>
            <Field label={copy.graceLabel} error={errors.gracePeriodMonths?.message}>
              <Input type="number" {...register("gracePeriodMonths")} />
            </Field>
            <div />

            <Field label="Course duration (months)">
              {readOnlyValue(courseDurationMonths ?? "")}
            </Field>
            <Field label="Total moratorium (months)">
              {readOnlyValue(totalMoratoriumMonths ?? "")}
            </Field>
            <Field label="Moratorium start">
              {readOnlyValue(moratoriumStartDate ?? "")}
            </Field>
            <Field label="Moratorium end">
              {readOnlyValue(moratoriumEndDate ?? "")}
            </Field>
          </div>

          <div className="space-y-1.5">
            <Label>{copy.interestQuestion}</Label>
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
                    <RadioGroupItem value={MoratoriumInterestPayment.PARTIAL} />
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

          {interestPayment !== MoratoriumInterestPayment.FULL && (
            <Controller
              control={control}
              name="capitalizeUnpaidInterest"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  Add unpaid interest to the loan balance each month
                  (compounds it) — otherwise it&apos;s added once as a lump
                  sum when the moratorium ends
                </label>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
