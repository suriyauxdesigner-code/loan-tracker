import { LoanType } from "@/generated/prisma/enums";
import type { WizardStepKey } from "./schema";

export interface StepDef {
  key: WizardStepKey;
  title: string;
}

/** Computes the ordered step list for the current loan type + existing-loan
 * toggle. Moratorium/construction only applies to Education and Home loans;
 * Personal loans skip Disbursement entirely (single implicit disbursement).
 * Gold/Business/Other default to the same lean flow as Bike/Car. */
export function getWizardSteps(
  loanType: string,
  isExistingLoan: boolean,
): StepDef[] {
  const steps: StepDef[] = [{ key: "details", title: "Loan Details" }];

  if (isExistingLoan) {
    steps.push({ key: "previous-payments", title: "Previous Payments" });
  }

  if (loanType === LoanType.EDUCATION) {
    steps.push({ key: "moratorium", title: "Study Period & Moratorium" });
  }

  if (loanType !== LoanType.PERSONAL) {
    steps.push({ key: "disbursement", title: "Disbursement" });
  }

  if (loanType === LoanType.HOME) {
    steps.push({ key: "moratorium", title: "Construction Phase" });
  }

  steps.push({ key: "review", title: "Review" });

  return steps;
}
