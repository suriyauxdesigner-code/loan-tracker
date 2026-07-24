import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import {
  computeAnnuityEmi,
  computeFinalPeriodPayment,
  computeFlatEmi,
  computeInterestOnlyEmi,
} from "./emi";

describe("computeAnnuityEmi", () => {
  it("matches the well-known reference EMI-per-1000 table for 12%/12mo", () => {
    // Standard reference: EMI per 1000 principal at 12% p.a., 12 months ≈ 88.8488
    const emi = computeAnnuityEmi(new Decimal(120000), new Decimal(0.01), 12);
    expect(emi.toNumber()).toBeCloseTo(10661.86, 1);
  });

  it("guards r=0 with straight-line division", () => {
    const emi = computeAnnuityEmi(new Decimal(120000), new Decimal(0), 12);
    expect(emi.toNumber()).toBe(10000);
  });

  it("returns 0 for zero periods", () => {
    const emi = computeAnnuityEmi(new Decimal(1000), new Decimal(0.01), 0);
    expect(emi.toNumber()).toBe(0);
  });
});

describe("computeFlatEmi", () => {
  it("computes flat/add-on interest EMI", () => {
    // (100000 + 100000*0.01*12) / 12 = (100000 + 12000) / 12 = 9333.33
    const emi = computeFlatEmi(new Decimal(100000), new Decimal(0.01), 12);
    expect(emi.toNumber()).toBeCloseTo(9333.33, 1);
  });
});

describe("computeInterestOnlyEmi", () => {
  it("equals the interest accrued that period", () => {
    expect(computeInterestOnlyEmi(new Decimal(1234.56)).toNumber()).toBe(
      1234.56,
    );
  });
});

describe("computeFinalPeriodPayment", () => {
  it("is the plug value that exactly zeroes the balance", () => {
    const payment = computeFinalPeriodPayment(
      new Decimal(543.21),
      new Decimal(5.43),
    );
    expect(payment.toNumber()).toBe(548.64);
  });
});
