"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoanType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createLoan } from "../actions";
import {
  getStepFields,
  loanSetupDefaults,
  loanSetupSchema,
  type LoanSetupValues,
  type WizardStepKey,
} from "../schema";
import { getWizardSteps } from "../step-config";
import { StepLoanDetails } from "./step-loan-details";
import { StepPreviousPayments } from "./step-previous-payments";
import { StepMoratorium } from "./step-moratorium";
import { StepDisbursements } from "./step-disbursements";
import { StepReview } from "./step-review";

export function LoanSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoanSetupValues>({
    resolver: zodResolver(loanSetupSchema),
    defaultValues: loanSetupDefaults,
    mode: "onBlur",
  });

  const loanType = form.watch("loanType");
  const isExistingLoan = form.watch("isExistingLoan");
  const steps = getWizardSteps(loanType, isExistingLoan);

  // Loan type only changes while on Step 1, so this never needs to clamp
  // mid-flow — but guards against an out-of-range index defensively.
  useEffect(() => {
    if (step >= steps.length) setStep(Math.max(0, steps.length - 1));
  }, [steps.length, step]);

  const currentStep = steps[Math.min(step, steps.length - 1)];
  const isLastStep = step === steps.length - 1;

  async function handleNext() {
    const valid = await form.trigger(getStepFields(currentStep.key));
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
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
          <CardTitle>{currentStep.title}</CardTitle>
          <span className="text-muted-foreground text-xs">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <Progress value={((step + 1) / steps.length) * 100} />
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <StepBody stepKey={currentStep.key} form={form} loanType={loanType} />
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

function StepBody({
  stepKey,
  form,
  loanType,
}: {
  stepKey: WizardStepKey;
  form: ReturnType<typeof useForm<LoanSetupValues>>;
  loanType: string;
}) {
  switch (stepKey) {
    case "details":
      return <StepLoanDetails form={form} />;
    case "previous-payments":
      return <StepPreviousPayments form={form} />;
    case "moratorium":
      return (
        <StepMoratorium
          form={form}
          variant={loanType === LoanType.HOME ? "home" : "education"}
        />
      );
    case "disbursement":
      return <StepDisbursements form={form} />;
    case "review":
      return <StepReview form={form} />;
  }
}
