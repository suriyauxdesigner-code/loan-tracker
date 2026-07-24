import { Decimal } from "decimal.js";
import {
  generateSchedule,
  type GenerateScheduleResult,
  type LoanEngineInput,
} from "@/lib/loan-engine";

/** Interest saved from extra/lump-sum payments actually made — computed
 * by rerunning the same pure engine with those payments filtered out and
 * diffing total interest against the real schedule. No new engine logic,
 * just a second call to the same generateSchedule. Returns null when
 * there are no extra payments to compare against (an honest "nothing to
 * show yet" rather than a fabricated zero). */
export function computeInterestSaved(
  input: LoanEngineInput,
  actualResult: GenerateScheduleResult,
): Decimal | null {
  const hasExtraPayments = input.payments.some(
    (p) => p.type === "EXTRA" || p.type === "LUMP_SUM",
  );
  if (!hasExtraPayments) return null;

  const withoutExtra = generateSchedule({
    ...input,
    payments: input.payments.filter(
      (p) => p.type !== "EXTRA" && p.type !== "LUMP_SUM",
    ),
  });

  const totalInterestWithout = withoutExtra.entries.reduce(
    (sum, e) => sum.plus(e.interestAccrued),
    new Decimal(0),
  );
  const totalInterestWith = actualResult.entries.reduce(
    (sum, e) => sum.plus(e.interestAccrued),
    new Decimal(0),
  );

  return totalInterestWithout.minus(totalInterestWith);
}
