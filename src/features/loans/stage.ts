/** Pure date-comparison logic — no financial math, just categorizing
 * which lifecycle stage a loan is in right now from its existing dates.
 * Recomputed fresh from `now` rather than trusting the stored Loan.status,
 * which is only ever written back on the CLOSED transition (see
 * regenerateSchedule) and can otherwise go stale as time passes. */

export type LoanStage =
  | "CREATED"
  | "DISBURSEMENT"
  | "STUDY_PERIOD"
  | "MORATORIUM"
  | "REPAYMENT"
  | "CLOSED";

export interface LoanStageInput {
  status: string;
  hasMoratorium: boolean;
  sanctionDate: Date;
  studyStartDate: Date | null;
  studyEndDate: Date | null;
  moratoriumStartDate: Date | null;
  moratoriumEndDate: Date | null;
  emiStartDate: Date | null;
}

export function deriveLoanStage(loan: LoanStageInput, now: Date): LoanStage {
  if (loan.status === "CLOSED") return "CLOSED";

  if (loan.hasMoratorium) {
    if (loan.studyEndDate && now <= loan.studyEndDate) {
      return loan.studyStartDate && now < loan.studyStartDate
        ? "DISBURSEMENT"
        : "STUDY_PERIOD";
    }
    if (loan.moratoriumEndDate && now <= loan.moratoriumEndDate) {
      return "MORATORIUM";
    }
  }

  if (loan.emiStartDate && now < loan.emiStartDate) return "DISBURSEMENT";
  if (now < loan.sanctionDate) return "CREATED";
  return "REPAYMENT";
}

export interface TimelineStep {
  key: string;
  label: string;
  date: Date | null;
  isPast: boolean;
  isCurrent: boolean;
}

export function buildLoanTimeline(
  loan: LoanStageInput & { targetClosureDate: Date | null },
  projectedClosureDate: Date | null,
  now: Date,
): TimelineStep[] {
  const stage = deriveLoanStage(loan, now);

  const steps: { key: LoanStage; label: string; date: Date | null }[] = [
    { key: "CREATED", label: "Loan Created", date: loan.sanctionDate },
    { key: "DISBURSEMENT", label: "Disbursement", date: loan.sanctionDate },
    ...(loan.hasMoratorium
      ? ([
          { key: "STUDY_PERIOD", label: "Study Period", date: loan.studyStartDate },
          { key: "MORATORIUM", label: "Moratorium", date: loan.moratoriumStartDate },
        ] as const)
      : []),
    { key: "REPAYMENT", label: "Repayment Started", date: loan.emiStartDate },
    { key: "CLOSED", label: "Loan Closed", date: projectedClosureDate },
  ];

  const stageOrder = steps.map((s) => s.key);
  const currentIndex = stageOrder.indexOf(stage);

  return steps.map((s, i) => ({
    key: s.key,
    label: s.label,
    date: s.date,
    isPast: i < currentIndex,
    isCurrent: i === currentIndex,
  }));
}
