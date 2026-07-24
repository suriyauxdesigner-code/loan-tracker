"use client";

import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { PaymentType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LoanSetupValues } from "../schema";

export function StepPreviousPayments({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const { register, control } = form;
  const payments = useFieldArray({ control, name: "existingPayments" });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Previous payments</h3>
          <p className="text-muted-foreground text-xs">
            Repayments you already made before setting this up.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            payments.append({
              date: "",
              amount: "",
              type: PaymentType.EMI,
              interestPaid: "",
              principalPaid: "",
              remarks: "",
            })
          }
        >
          <Plus /> Add payment
        </Button>
      </div>
      <div className="space-y-3">
        {payments.fields.map((row, i) => (
          <div
            key={row.id}
            className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <Input type="date" {...register(`existingPayments.${i}.date`)} />
            <Input
              {...register(`existingPayments.${i}.amount`)}
              inputMode="decimal"
              placeholder="Amount"
            />
            <Controller
              control={control}
              name={`existingPayments.${i}.type`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              {...register(`existingPayments.${i}.interestPaid`)}
              inputMode="decimal"
              placeholder="Interest paid"
            />
            <Input
              {...register(`existingPayments.${i}.principalPaid`)}
              inputMode="decimal"
              placeholder="Principal paid"
            />
            <div className="flex gap-2">
              <Input
                {...register(`existingPayments.${i}.remarks`)}
                placeholder="Remarks"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => payments.remove(i)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {payments.fields.length === 0 && (
          <p className="text-muted-foreground text-xs">
            No previous payments added yet.
          </p>
        )}
      </div>
    </section>
  );
}
