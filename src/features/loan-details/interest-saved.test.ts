import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { generateSchedule } from "@/lib/loan-engine";
import { baseInput } from "@/lib/loan-engine/test-helpers";
import { computeInterestSaved } from "./interest-saved";

const BEFORE_INCEPTION = new Date("2020-01-01");

describe("computeInterestSaved", () => {
  it("returns null when there are no extra/lump-sum payments", () => {
    const input = baseInput();
    const result = generateSchedule(input, BEFORE_INCEPTION);
    expect(computeInterestSaved(input, result)).toBeNull();
  });

  it("returns positive interest saved when a lump-sum payment shortens the schedule", () => {
    const input = baseInput({
      prepaymentStrategy: "REDUCE_TENURE",
      payments: [
        { date: new Date("2024-07-01"), amount: new Decimal(30000), type: "LUMP_SUM" },
      ],
    });
    const result = generateSchedule(input, BEFORE_INCEPTION);
    const saved = computeInterestSaved(input, result);
    expect(saved).not.toBeNull();
    expect(saved!.toNumber()).toBeGreaterThan(0);
  });
});
