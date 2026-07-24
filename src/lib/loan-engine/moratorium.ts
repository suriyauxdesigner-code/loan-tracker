import { Decimal } from "decimal.js";
import type { CompoundingFrequency, MoratoriumInterestPayment } from "./types";

/** Whether the Nth moratorium period (1-indexed) is a capitalization
 * boundary at the given frequency — generalizes "capitalize every period"
 * into "capitalize every period at this cadence," reusing the same
 * `CompoundingFrequency` the loan already has instead of a raw boolean.
 * DAILY is treated as MONTHLY here since moratorium periods are
 * monthly-grain in this schedule (documented simplification). */
export function isCapitalizationBoundary(
  compounding: CompoundingFrequency,
  periodIndex: number,
): boolean {
  switch (compounding) {
    case "DAILY":
    case "MONTHLY":
      return true;
    case "QUARTERLY":
      return periodIndex % 3 === 0;
    case "YEARLY":
      return periodIndex % 12 === 0;
  }
}

export interface MoratoriumPeriodResult {
  interestPaid: Decimal;
  shortfall: Decimal;
  capitalizedThisPeriod: Decimal;
  closingBalance: Decimal;
  carriedShortfall: Decimal;
}

/** Takes an already-computed `interestAccrued` (from the day-count- and
 * change-point-aware `accruePeriodInterest`, which correctly handles a
 * mid-period disbursement) and applies the moratorium payment policy to
 * it — this function only decides how that interest is paid/capitalized,
 * it never computes accrual itself. */
export function computeMoratoriumPeriod(input: {
  openingBalance: Decimal;
  interestAccrued: Decimal;
  paymentPolicy: MoratoriumInterestPayment;
  avgMonthlyPayment: Decimal | null;
  capitalizeEachPeriod: boolean;
  carriedShortfall: Decimal;
}): MoratoriumPeriodResult {
  const interestAccrued = input.interestAccrued;

  let interestPaid: Decimal;
  if (input.paymentPolicy === "FULL") {
    interestPaid = interestAccrued;
  } else if (input.paymentPolicy === "PARTIAL") {
    interestPaid = Decimal.min(
      input.avgMonthlyPayment ?? new Decimal(0),
      interestAccrued,
    );
  } else {
    interestPaid = new Decimal(0);
  }

  const shortfall = interestAccrued.minus(interestPaid);

  let closingBalance = input.openingBalance;
  let capitalizedThisPeriod = new Decimal(0);
  let carriedShortfall = input.carriedShortfall;

  if (input.capitalizeEachPeriod) {
    // True compounding: next period's interest is computed on the larger balance.
    closingBalance = input.openingBalance.plus(shortfall);
    capitalizedThisPeriod = shortfall;
  } else {
    // Shortfall accumulates uncompounded until it's added once, in a single
    // lump sum, when the moratorium ends (see lumpSumCapitalizeAtMoratoriumEnd).
    carriedShortfall = carriedShortfall.plus(shortfall);
  }

  return {
    interestPaid,
    shortfall,
    capitalizedThisPeriod,
    closingBalance,
    carriedShortfall,
  };
}

export function lumpSumCapitalizeAtMoratoriumEnd(
  carriedShortfall: Decimal,
  closingBalance: Decimal,
): Decimal {
  return closingBalance.plus(carriedShortfall);
}
