import { Decimal } from "decimal.js";
import type { MoratoriumInterestPayment } from "./types";

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
