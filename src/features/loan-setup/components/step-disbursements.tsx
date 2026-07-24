"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoanSetupValues } from "../schema";

export function StepDisbursements({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const disbursements = useFieldArray({ control, name: "disbursements" });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Disbursements</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            disbursements.append({ date: "", amount: "", remarks: "" })
          }
        >
          <Plus /> Add disbursement
        </Button>
      </div>
      <div className="space-y-3">
        {disbursements.fields.map((row, i) => (
          <div
            key={row.id}
            className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Input type="date" {...register(`disbursements.${i}.date`)} />
            <Input
              {...register(`disbursements.${i}.amount`)}
              inputMode="decimal"
              placeholder="Amount"
            />
            <Input
              {...register(`disbursements.${i}.remarks`)}
              placeholder="Remarks (optional)"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => disbursements.remove(i)}
              disabled={disbursements.fields.length === 1}
            >
              <Trash2 />
            </Button>
            {(errors.disbursements?.[i]?.date ||
              errors.disbursements?.[i]?.amount) && (
              <p className="text-destructive col-span-full text-xs">
                {errors.disbursements?.[i]?.date?.message ||
                  errors.disbursements?.[i]?.amount?.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
