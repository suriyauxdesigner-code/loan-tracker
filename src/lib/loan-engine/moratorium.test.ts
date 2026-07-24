import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import {
  computeMoratoriumPeriod,
  lumpSumCapitalizeAtMoratoriumEnd,
} from "./moratorium";

describe("computeMoratoriumPeriod", () => {
  it("NONE + capitalize=true compounds the shortfall into the balance each period", () => {
    const opening = new Decimal(100000);
    const interestAccrued = new Decimal(1000);
    const result = computeMoratoriumPeriod({
      openingBalance: opening,
      interestAccrued,
      paymentPolicy: "NONE",
      avgMonthlyPayment: null,
      capitalizeEachPeriod: true,
      carriedShortfall: new Decimal(0),
    });
    expect(result.closingBalance.toNumber()).toBe(101000);
    expect(result.carriedShortfall.toNumber()).toBe(0);
  });

  it("NONE + capitalize=false leaves the balance flat and carries the shortfall instead", () => {
    const opening = new Decimal(100000);
    const interestAccrued = new Decimal(1000);
    const result = computeMoratoriumPeriod({
      openingBalance: opening,
      interestAccrued,
      paymentPolicy: "NONE",
      avgMonthlyPayment: null,
      capitalizeEachPeriod: false,
      carriedShortfall: new Decimal(0),
    });
    expect(result.closingBalance.toNumber()).toBe(100000);
    expect(result.carriedShortfall.toNumber()).toBe(1000);
  });

  it("produces a strictly larger post-moratorium balance when capitalizing each period vs. not, over multiple periods", () => {
    let capitalizedBalance = new Decimal(100000);
    let flatBalance = new Decimal(100000);
    let carried = new Decimal(0);
    const monthlyRate = new Decimal(0.01);

    for (let i = 0; i < 6; i++) {
      // Interest is recomputed from each path's own current balance every
      // period — this is what makes capitalizing-each-period compound
      // (interest-on-interest) while the flat/carried path doesn't.
      const capResult = computeMoratoriumPeriod({
        openingBalance: capitalizedBalance,
        interestAccrued: capitalizedBalance.times(monthlyRate),
        paymentPolicy: "NONE",
        avgMonthlyPayment: null,
        capitalizeEachPeriod: true,
        carriedShortfall: new Decimal(0),
      });
      capitalizedBalance = capResult.closingBalance;

      const flatResult = computeMoratoriumPeriod({
        openingBalance: flatBalance,
        interestAccrued: flatBalance.times(monthlyRate),
        paymentPolicy: "NONE",
        avgMonthlyPayment: null,
        capitalizeEachPeriod: false,
        carriedShortfall: carried,
      });
      flatBalance = flatResult.closingBalance;
      carried = flatResult.carriedShortfall;
    }
    const flatFinal = lumpSumCapitalizeAtMoratoriumEnd(carried, flatBalance);

    // Compounding-each-period grows faster since later periods accrue
    // interest on an already-larger balance; the uncompounded lump-sum
    // path adds the same total shortfall but never compounds it.
    expect(capitalizedBalance.greaterThan(flatFinal)).toBe(true);
  });

  it("PARTIAL payment covers up to the average monthly amount, shortfall is the remainder", () => {
    const result = computeMoratoriumPeriod({
      openingBalance: new Decimal(100000),
      interestAccrued: new Decimal(1000),
      paymentPolicy: "PARTIAL",
      avgMonthlyPayment: new Decimal(600),
      capitalizeEachPeriod: false,
      carriedShortfall: new Decimal(0),
    });
    expect(result.interestPaid.toNumber()).toBe(600);
    expect(result.shortfall.toNumber()).toBe(400);
    expect(result.carriedShortfall.toNumber()).toBe(400);
  });

  it("FULL payment leaves no shortfall regardless of capitalize setting", () => {
    const result = computeMoratoriumPeriod({
      openingBalance: new Decimal(100000),
      interestAccrued: new Decimal(1000),
      paymentPolicy: "FULL",
      avgMonthlyPayment: null,
      capitalizeEachPeriod: true,
      carriedShortfall: new Decimal(0),
    });
    expect(result.shortfall.toNumber()).toBe(0);
    expect(result.closingBalance.toNumber()).toBe(100000);
  });
});
