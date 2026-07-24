import { Decimal } from "decimal.js";
import type { DisbursementInput } from "./types";

/** Returns a function giving cumulative disbursed principal as of any date
 * — the engine only ever reads balance from real Disbursement rows, never
 * fabricates it from principalAmount. */
export function buildDisbursementTimeline(
  disbursements: DisbursementInput[],
): (asOf: Date) => Decimal {
  const sorted = [...disbursements].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  return (asOf: Date): Decimal =>
    sorted
      .filter((d) => d.date <= asOf)
      .reduce((sum, d) => sum.plus(d.amount), new Decimal(0));
}

export function disbursementDatesWithin(
  disbursements: DisbursementInput[],
  start: Date,
  end: Date,
): Date[] {
  return disbursements
    .map((d) => d.date)
    .filter((d) => d > start && d < end);
}
