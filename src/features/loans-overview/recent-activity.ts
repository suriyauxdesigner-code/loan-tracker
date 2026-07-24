/** Real, currently-trackable events only — Loan Created, Disbursement
 * Added, Payment Recorded — built from existing timestamps. No fabricated
 * "Interest Posted"/"Rate Changed"/"Schedule Regenerated" entries since
 * nothing logs those yet (confirmed scope). */

export type ActivityKind = "LOAN_CREATED" | "DISBURSEMENT" | "PAYMENT";

export interface ActivityEvent {
  kind: ActivityKind;
  date: Date;
  title: string;
  detail: string;
}

export interface ActivitySourceLoan {
  createdAt: Date;
  currency: string;
  loanName: string;
  disbursements: { id: string; date: Date; amount: { toString(): string } }[];
  payments: { id: string; date: Date; amount: { toString(): string }; type: string }[];
}

export function buildRecentActivity(loan: ActivitySourceLoan, limit = 8): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      kind: "LOAN_CREATED",
      date: loan.createdAt,
      title: "Loan created",
      detail: `${loan.loanName} added to Loan Tracker`,
    },
    ...loan.disbursements.map((d) => ({
      kind: "DISBURSEMENT" as const,
      date: d.date,
      title: "Disbursement recorded",
      detail: `${loan.currency} ${d.amount.toString()} disbursed`,
    })),
    ...loan.payments.map((p) => ({
      kind: "PAYMENT" as const,
      date: p.date,
      title: p.type === "EMI" ? "EMI payment recorded" : "Extra payment recorded",
      detail: `${loan.currency} ${p.amount.toString()} paid`,
    })),
  ];

  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
