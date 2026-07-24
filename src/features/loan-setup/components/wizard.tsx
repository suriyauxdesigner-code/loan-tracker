"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createLoan } from "../actions";
import {
  loanSetupDefaults,
  loanSetupSchema,
  STEP_FIELDS,
  type LoanSetupValues,
} from "../schema";
import { StepBasicsTerms } from "./step-basics-terms";
import { StepMoratorium } from "./step-moratorium";
import { StepDisbursements } from "./step-disbursements";
import { StepSettingsReview } from "./step-settings-review";

const STEPS = [
  { title: "Loan basics & terms", component: StepBasicsTerms },
  { title: "Moratorium", component: StepMoratorium },
  { title: "Disbursements & existing payments", component: StepDisbursements },
  { title: "Settings & review", component: StepSettingsReview },
];

export function LoanSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoanSetupValues>({
    resolver: zodResolver(loanSetupSchema),
    defaultValues: loanSetupDefaults,
    mode: "onBlur",
  });

  const StepComponent = STEPS[step].component;
  const isLastStep = step === STEPS.length - 1;

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onSubmit(values: LoanSetupValues) {
    startTransition(async () => {
      try {
        await createLoan(values);
        toast.success("Loan created");
        router.push("/");
        router.refresh();
      } catch {
        toast.error("Couldn't save the loan. Please try again.");
      }
    });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>{STEPS[step].title}</CardTitle>
          <span className="text-muted-foreground text-xs">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <StepComponent form={form} />
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0 || isPending}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating loan..." : "Create loan"}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
