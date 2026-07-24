import { Decimal } from "decimal.js";
import type { DayCountConvention } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function dayCountDenominator(convention: DayCountConvention): number {
  return convention === "DAYS_360" ? 360 : 365;
}

export function dayCountFraction(
  days: number,
  convention: DayCountConvention,
): Decimal {
  return new Decimal(days).dividedBy(dayCountDenominator(convention));
}

/** Adds `monthOffset` months to `anchorDate`, preserving day-of-month
 * (clamped to the last day of the target month). Keeps due-date cadence
 * anchored to the original schedule instead of drifting. */
export function addMonthsAnchored(anchorDate: Date, monthOffset: number): Date {
  const day = anchorDate.getUTCDate();
  const firstOfTargetMonth = new Date(
    Date.UTC(
      anchorDate.getUTCFullYear(),
      anchorDate.getUTCMonth() + monthOffset,
      1,
    ),
  );
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      firstOfTargetMonth.getUTCFullYear(),
      firstOfTargetMonth.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();
  firstOfTargetMonth.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

export function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth())
  );
}
