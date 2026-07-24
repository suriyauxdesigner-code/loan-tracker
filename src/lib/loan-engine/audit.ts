import { Decimal } from "decimal.js";
import type {
  BalanceAuditChainLink,
  LoanEngineInput,
  ScheduleAnomaly,
  ScheduleEntry,
} from "./types";

const RECONCILE_EPSILON = new Decimal("0.02");

/** Pure re-expression of already-generated entries as the
 * opening -> interest posting -> capitalization -> payments ->
 * extra payments -> closing waterfall — no new financial math, just a
 * cross-period reduction over engine output, for the "Calculation Audit
 * Mode" view. */
export function buildBalanceAuditChain(
  entries: ScheduleEntry[],
): BalanceAuditChainLink[] {
  return entries.map((e) => {
    const regularPayment = e.interestPaid.plus(
      Decimal.max(0, e.principalPaid.minus(e.extraPayment)),
    );
    const expectedClosing = e.openingBalance
      .plus(e.capitalizedInterest)
      .minus(e.principalPaid);

    return {
      monthIndex: e.monthIndex,
      openingBalance: e.openingBalance,
      interestPosted: e.interestAccrued,
      capitalized: e.capitalizedInterest,
      regularPayment,
      extraPayment: e.extraPayment,
      closingBalance: e.closingBalance,
      reconciles: expectedClosing.minus(e.closingBalance).abs().lessThanOrEqualTo(RECONCILE_EPSILON),
    };
  });
}

function anomaly(
  code: string,
  severity: ScheduleAnomaly["severity"],
  monthIndex: number | null,
  message: string,
): ScheduleAnomaly {
  return { code, severity, monthIndex, message };
}

/** Schedule-*output* validation — checked after generation, distinct from
 * validateLoanInputs (input-side, before generation runs). */
export function auditSchedule(
  entries: ScheduleEntry[],
  input: LoanEngineInput,
  converged: boolean,
): ScheduleAnomaly[] {
  const anomalies: ScheduleAnomaly[] = [];

  for (const e of entries) {
    if (
      // Moratorium periods legitimately grow the balance by design (unpaid
      // interest capitalizing per the selected policy) — that's not
      // negative amortization, it only applies once EMIs are meant to be
      // covering interest + principal.
      e.phase === "EMI" &&
      input.emiType !== "INTEREST_ONLY" &&
      e.closingBalance.greaterThan(e.openingBalance.plus("0.01")) &&
      e.status !== "MISSED"
    ) {
      anomalies.push(
        anomaly(
          "NEGATIVE_AMORTIZATION",
          "warning",
          e.monthIndex,
          `Month ${e.monthIndex}: the balance grew from ${e.openingBalance.toFixed(2)} to ${e.closingBalance.toFixed(2)} instead of shrinking — the EMI (${e.emiAmount.toFixed(2)}) doesn't cover the interest accrued (${e.interestAccrued.toFixed(2)}). Increase the EMI or extend the tenure.`,
        ),
      );
    }
  }

  if (!converged) {
    const last = entries[entries.length - 1];
    anomalies.push(
      anomaly(
        "NON_CONVERGENT",
        "error",
        last?.monthIndex ?? null,
        last
          ? `The schedule didn't reach zero within the expected tenure — ${last.closingBalance.toFixed(2)} remains outstanding after ${entries.length} periods. The EMI may be too low relative to the interest rate and tenure.`
          : "The schedule could not be generated.",
      ),
    );
  }

  const auditChain = buildBalanceAuditChain(entries);
  for (const link of auditChain) {
    if (!link.reconciles) {
      anomalies.push(
        anomaly(
          "CLOSING_BALANCE_MISMATCH",
          "error",
          link.monthIndex,
          `Month ${link.monthIndex}: closing balance doesn't reconcile with opening balance, interest, capitalization, and payments for that period — this indicates an engine bug, not a normal loan variance.`,
        ),
      );
    }
  }

  const finalEntry = entries[entries.length - 1];
  if (converged && finalEntry && !finalEntry.closingBalance.isZero()) {
    anomalies.push(
      anomaly(
        "FINAL_BALANCE_NOT_ZERO",
        "warning",
        finalEntry.monthIndex,
        `The final period's closing balance is ${finalEntry.closingBalance.toFixed(2)}, not exactly zero.`,
      ),
    );
  }

  return anomalies;
}
