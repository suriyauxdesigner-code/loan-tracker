import { Decimal } from "decimal.js";

/** Standard reducing-balance annuity EMI. Guards r=0 (straight-line). */
export function computeAnnuityEmi(
  principal: Decimal,
  periodicRate: Decimal,
  numberOfPeriods: number,
): Decimal {
  if (numberOfPeriods <= 0) return new Decimal(0);
  if (periodicRate.isZero()) {
    return principal.dividedBy(numberOfPeriods);
  }
  const onePlusR = periodicRate.plus(1);
  const factor = onePlusR.pow(numberOfPeriods);
  return principal.times(periodicRate).times(factor).dividedBy(factor.minus(1));
}

/** SIMPLE (flat/add-on) method's own EMI formula — incompatible with the
 * annuity formula since flat interest doesn't shrink as principal is paid. */
export function computeFlatEmi(
  principal: Decimal,
  periodicRate: Decimal,
  numberOfPeriods: number,
): Decimal {
  if (numberOfPeriods <= 0) return new Decimal(0);
  const totalInterest = principal.times(periodicRate).times(numberOfPeriods);
  return principal.plus(totalInterest).dividedBy(numberOfPeriods);
}

export function computeInterestOnlyEmi(interestAccrued: Decimal): Decimal {
  return interestAccrued;
}

/** Plug value for the final period so the schedule hits exactly zero
 * instead of leaving rounding-drift paise forever. */
export function computeFinalPeriodPayment(
  openingBalance: Decimal,
  interestAccrued: Decimal,
): Decimal {
  return openingBalance.plus(interestAccrued);
}
