import { describe, expect, it } from "vitest";
import { generateSchedule } from "./schedule";
import { buildBalanceAuditChain } from "./audit";
import { baseInput } from "./test-helpers";

const BEFORE_INCEPTION = new Date("2020-01-01");

describe("buildBalanceAuditChain", () => {
  it("reconciles every link for a clean, converging loan", () => {
    const result = generateSchedule(baseInput(), BEFORE_INCEPTION);
    const chain = buildBalanceAuditChain(result.entries);
    expect(chain.length).toBe(result.entries.length);
    for (const link of chain) {
      expect(link.reconciles).toBe(true);
    }
  });

  it("re-expresses each entry's numbers without altering them", () => {
    const result = generateSchedule(baseInput(), BEFORE_INCEPTION);
    const chain = buildBalanceAuditChain(result.entries);
    expect(chain[0].openingBalance.toNumber()).toBe(
      result.entries[0].openingBalance.toNumber(),
    );
    expect(chain[0].closingBalance.toNumber()).toBe(
      result.entries[0].closingBalance.toNumber(),
    );
  });
});
