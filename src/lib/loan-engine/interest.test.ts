import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { accruePeriodInterest, accrueSimpleInterest } from "./interest";
import { dayCountFraction } from "./date-utils";

describe("accrueSimpleInterest", () => {
  it("uses the day-count convention, not a flat /12", () => {
    const balance = new Decimal(100000);
    const rate = new Decimal(12);
    const days = 31; // January
    const at365 = accrueSimpleInterest(balance, rate, days, "DAYS_365");
    const at360 = accrueSimpleInterest(balance, rate, days, "DAYS_360");
    // 360-day convention yields (slightly) more interest for the same days.
    expect(at360.greaterThan(at365)).toBe(true);
    expect(at365.toNumber()).toBeCloseTo(
      (100000 * 0.12 * 31) / 365,
      6,
    );
  });
});

describe("accruePeriodInterest", () => {
  it("date-weights a mid-period disbursement instead of assuming a flat balance", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-02-01"); // 31 days
    const disbursementDate = new Date("2024-01-16"); // 15 days in, 16 days remaining
    const rate = new Decimal(12);

    const balanceAt = (d: Date) =>
      d < disbursementDate ? new Decimal(50000) : new Decimal(100000);

    const weighted = accruePeriodInterest(
      start,
      end,
      rate,
      "DAYS_365",
      balanceAt,
      [disbursementDate],
    );

    // Flat assumption at the opening (50000) or closing (100000) balance
    // for the whole period would both be wrong — the true value must sit
    // strictly between them.
    const flatAtOpening = accrueSimpleInterest(new Decimal(50000), rate, 31, "DAYS_365");
    const flatAtClosing = accrueSimpleInterest(new Decimal(100000), rate, 31, "DAYS_365");

    expect(weighted.greaterThan(flatAtOpening)).toBe(true);
    expect(weighted.lessThan(flatAtClosing)).toBe(true);
  });

  it("matches a flat calculation when there are no change points", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-02-01");
    const rate = new Decimal(10);
    const balance = new Decimal(75000);

    const result = accruePeriodInterest(
      start,
      end,
      rate,
      "DAYS_365",
      () => balance,
    );
    const flat = accrueSimpleInterest(balance, rate, 31, "DAYS_365");
    expect(result.toNumber()).toBeCloseTo(flat.toNumber(), 8);
  });
});

describe("dayCountFraction", () => {
  it("divides by 365 or 360 depending on convention", () => {
    expect(dayCountFraction(30, "DAYS_365").toNumber()).toBeCloseTo(30 / 365, 8);
    expect(dayCountFraction(30, "DAYS_360").toNumber()).toBeCloseTo(30 / 360, 8);
  });
});
