import type { LoanEngineInput, ValidationIssue } from "./types";

export function validateLoanInputs(input: LoanEngineInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (input.interestRatePercent.isNegative()) {
    issues.push({
      code: "NEGATIVE_RATE",
      severity: "error",
      message: "Interest rate cannot be negative.",
    });
  }

  if (input.loanTenureMonths <= 0) {
    issues.push({
      code: "INVALID_TENURE",
      severity: "error",
      message: "Loan tenure must be greater than zero.",
    });
  }

  if (input.repaymentTenureMonths <= 0) {
    issues.push({
      code: "INVALID_REPAYMENT_TENURE",
      severity: "error",
      message: "Repayment tenure must be greater than zero.",
    });
  }

  if (input.hasMoratorium) {
    if (input.disbursements.length > 0 && input.moratoriumEndDate) {
      const firstDisbursement = input.disbursements.reduce(
        (min, d) => (d.date < min ? d.date : min),
        input.disbursements[0].date,
      );
      if (input.moratoriumEndDate < firstDisbursement) {
        issues.push({
          code: "MORATORIUM_BEFORE_DISBURSEMENT",
          severity: "error",
          message: "Moratorium end date is before the first disbursement.",
        });
      }
    }

    if (
      input.emiStartDate &&
      input.moratoriumEndDate &&
      input.emiStartDate < input.moratoriumEndDate
    ) {
      issues.push({
        code: "EMI_BEFORE_MORATORIUM_END",
        severity: "warning",
        message:
          "EMI start date is before the moratorium end date — using the earlier date to bound the moratorium phase.",
      });
    }

    if (
      input.moratoriumInterestPayment === "PARTIAL" &&
      !input.moratoriumAvgMonthlyInterest
    ) {
      issues.push({
        code: "MISSING_PARTIAL_AMOUNT",
        severity: "error",
        message:
          "Partial moratorium interest payment selected but no monthly amount was provided.",
      });
    }
  }

  if (input.disbursements.length === 0) {
    issues.push({
      code: "NO_DISBURSEMENTS",
      severity: "error",
      message: "At least one disbursement is required to generate a schedule.",
    });
  }

  return issues;
}
