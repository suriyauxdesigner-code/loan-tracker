import type { LoanStatus } from "./types";
import { addMonthsAnchored, monthsBetween } from "./date-utils";

export interface SeedState {
  resumeFromPhase: "MORATORIUM" | "EMI";
  /** The next due date aligned to the original cadence, on or after
   * asOfDate. If it equals asOfDate exactly, there's no stub period. */
  nextAlignedDueDate: Date;
}

/** For an existing-loan import, keeps due dates anchored to the original
 * day-of-month cadence (from `cadenceAnchor`, e.g. emiStartDate) instead of
 * drifting by whatever offset `asOfDate` happens to fall at. */
export function buildSeedState(
  asOfDate: Date,
  status: LoanStatus,
  cadenceAnchor: Date,
): SeedState {
  const resumeFromPhase =
    status === "MORATORIUM" || status === "STUDY_PERIOD" ? "MORATORIUM" : "EMI";

  let offset = monthsBetween(cadenceAnchor, asOfDate);
  let candidate = addMonthsAnchored(cadenceAnchor, offset);
  if (candidate.getTime() < asOfDate.getTime()) {
    offset += 1;
    candidate = addMonthsAnchored(cadenceAnchor, offset);
  }

  return { resumeFromPhase, nextAlignedDueDate: candidate };
}
