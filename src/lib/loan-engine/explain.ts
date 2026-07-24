import { Decimal } from "decimal.js";
import type {
  CalculationStep,
  DayCountConvention,
  EmiType,
  InterestCalculationMethod,
} from "./types";
import { dayCountDenominator } from "./date-utils";

/** Formats a Decimal using Indian digit grouping (matches how this app's
 * loans are typically denominated) — purely a display helper, no
 * financial calculation happens here. */
export function fmt(value: Decimal): string {
  return Number(value.toFixed(2)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function explainOpeningBalance(
  balance: Decimal,
  source: "disbursement" | "prior-closing" | "import-snapshot",
): CalculationStep {
  const sourceText: Record<typeof source, string> = {
    disbursement: "the amount disbursed so far",
    "prior-closing": "the previous period's closing balance",
    "import-snapshot": "the outstanding balance you provided when importing this loan",
  };
  return {
    key: "openingBalance",
    formula: fmt(balance),
    explanation: `Opening balance carried forward from ${sourceText[source]}.`,
    value: balance,
  };
}

export function explainRateApplied(ratePercent: Decimal): CalculationStep {
  return {
    key: "rateApplied",
    formula: `${ratePercent.toFixed(2)}% p.a.`,
    explanation: `The interest rate in effect for this period.`,
    value: ratePercent,
  };
}

const METHOD_LABEL: Record<InterestCalculationMethod, string> = {
  REDUCING_BALANCE: "reducing balance",
  SIMPLE: "flat/simple",
  COMPOUND: "compound",
};

export function explainInterestAccrual(
  method: InterestCalculationMethod,
  balance: Decimal,
  ratePercent: Decimal,
  days: number,
  convention: DayCountConvention,
  result: Decimal,
): CalculationStep {
  const denom = dayCountDenominator(convention);
  const formula =
    method === "COMPOUND"
      ? `${fmt(balance)} compounded daily at ${ratePercent.toFixed(2)}% p.a. over ${days} days = ${fmt(result)}`
      : `${fmt(balance)} × ${ratePercent.toFixed(2)}% × ${days}/${denom} = ${fmt(result)}`;
  return {
    key: "interestAccrual",
    formula,
    explanation: `Interest for ${days} day${days === 1 ? "" : "s"} on the opening balance of ${fmt(balance)} at ${ratePercent.toFixed(2)}% p.a., using the ${METHOD_LABEL[method]} method.`,
    value: result,
  };
}

export function explainCapitalization(
  shortfall: Decimal,
  newBalance: Decimal,
): CalculationStep {
  return {
    key: "capitalization",
    formula: `${fmt(shortfall)} added to principal`,
    explanation: `Unpaid interest of ${fmt(shortfall)} was added to the outstanding balance, which is now ${fmt(newBalance)}.`,
    value: shortfall,
  };
}

export function explainEmiSizing(
  emiType: EmiType,
  method: InterestCalculationMethod,
  isFinalPeriod: boolean,
  emi: Decimal,
): CalculationStep {
  if (isFinalPeriod) {
    return {
      key: "emiSizing",
      formula: `Opening balance + interest accrued = ${fmt(emi)}`,
      explanation:
        "This is the final installment — it pays off the exact remaining balance plus interest, instead of the regular EMI, so the loan closes at exactly zero.",
      value: emi,
    };
  }
  if (emiType === "INTEREST_ONLY") {
    return {
      key: "emiSizing",
      formula: `EMI = interest accrued = ${fmt(emi)}`,
      explanation:
        "Interest-only installment: the EMI equals this period's accrued interest; the full principal is due at the end of the tenure.",
      value: emi,
    };
  }
  if (method === "SIMPLE") {
    return {
      key: "emiSizing",
      formula: `(Principal + total flat interest) / tenure = ${fmt(emi)}`,
      explanation:
        "Flat/simple-interest EMI: a fixed installment computed once on the original principal for the whole tenure.",
      value: emi,
    };
  }
  return {
    key: "emiSizing",
    formula: `P × r × (1+r)^n / ((1+r)^n − 1) = ${fmt(emi)}`,
    explanation:
      "Standard reducing-balance annuity EMI, sized from the balance and remaining tenure at the time it was last calculated.",
    value: emi,
  };
}

export function explainPaymentApplication(
  interestPaid: Decimal,
  principalPaid: Decimal,
  interestAccrued: Decimal,
): CalculationStep {
  return {
    key: "paymentApplication",
    formula: `Interest portion ${fmt(interestPaid)} + Principal portion ${fmt(principalPaid)}`,
    explanation:
      interestPaid.greaterThanOrEqualTo(interestAccrued)
        ? `The payment covered the full ${fmt(interestAccrued)} of interest accrued this period, with the remainder reducing principal.`
        : `The payment was applied to interest first (${fmt(interestPaid)} of ${fmt(interestAccrued)} owed); nothing was left over for principal.`,
    value: interestPaid.plus(principalPaid),
  };
}

export function explainClosingBalance(
  opening: Decimal,
  principalPaid: Decimal,
  capitalized: Decimal,
  closing: Decimal,
): CalculationStep {
  const formula = capitalized.greaterThan(0)
    ? `${fmt(opening)} − ${fmt(principalPaid)} + ${fmt(capitalized)} = ${fmt(closing)}`
    : `${fmt(opening)} − ${fmt(principalPaid)} = ${fmt(closing)}`;
  return {
    key: "closingBalance",
    formula,
    explanation: `Closing balance after this period's principal payment${capitalized.greaterThan(0) ? " and capitalized interest" : ""}.`,
    value: closing,
  };
}
