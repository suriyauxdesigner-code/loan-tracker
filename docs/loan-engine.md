# Loan Calculation Engine — Design & Reference

This is the persistent reference for `src/lib/loan-engine/` — every business rule, every formula, every configurable point, and every deliberately deferred gap. If a number in the app looks wrong, this document (plus the engine's unit tests) is where to check first.

**Architectural rule this whole engine exists to enforce:** no financial calculation happens outside `src/lib/loan-engine/`. It is pure TypeScript, uses `decimal.js` throughout (never native floats), has zero imports from Prisma/Next.js/React, and is fully unit-tested. Every other layer — Server Actions, Server Components, the Dashboard — only ever calls into this engine or renders its output. If you find yourself writing `.times()` or `.dividedBy()` outside this folder, that's a bug in the architecture, not a shortcut.

## 1. How a schedule is generated

`generateSchedule(input, today)` in `schedule.ts` walks a loan through up to three phases, in order, producing one `ScheduleEntry` per period:

1. **Disbursement.** The balance at any date is the cumulative sum of `Disbursement` rows up to that date — the engine never fabricates a balance from `principalAmount`, only from real disbursements (see `disbursement.ts`).
2. **Moratorium** (only if `hasMoratorium`). Interest accrues on the disbursed-so-far balance; how it's paid and/or capitalized is governed by `moratoriumInterestPayment` and `capitalizeUnpaidInterest` (§4).
3. **EMI.** Standard repayment: each period accrues interest on the current amortizing balance, sizes/uses the EMI, and applies whatever was actually paid (or the on-time projection, if nothing's been recorded yet — §6).

An **existing-loan import** (`LoanImportSnapshot`) skips straight to whichever phase the loan's `status` says it's in, seeded from a snapshot balance instead of a zero starting point — see §7.

## 2. Interest accrual — two rates, not one

Every period uses **two distinct rates**, and conflating them is the single most common mistake in amateur loan calculators:

- **Installment-sizing rate** (`installmentRate` in `interest.ts`): `annualRate / periodsPerYear / 100`. A flat, nominal split — used **only** to size the EMI figure via the annuity formula. Real banks don't day-count-adjust the quoted installment amount; it's a fixed contractual number.
- **Period-accrual rate**: day-count based (`dayCountFraction`, `date-utils.ts`), using the *actual elapsed calendar days* in the period over 365 or 360 (`DayCountConvention`). This is what's actually booked as `interestAccrued` on each `AmortizationEntry` — and it varies slightly month to month (28–31 days), exactly like a real bank statement.

Because these two rates are used for two different purposes, a schedule sized with a nominal nominal-rate EMI will not *exactly* zero out in precisely the nominal number of periods — real day-count drift means it can land a period or two later than the nominal tenure. This is expected and correct (see the final-period plug value, §3), not a bug.

### Calculation methods (`LoanSettings.calculationMethod`)

| Method | Accrual | EMI sizing | Real-world match |
|---|---|---|---|
| `REDUCING_BALANCE` (default) | Simple interest, day-count, on the current amortizing balance ("monthly rest") | Standard annuity | The overwhelming default for Indian retail loans (SBI/HDFC/ICICI personal, home, education) |
| `SIMPLE` | Same day-count accrual as above | **Flat/add-on**: `(P + P×r×n) / n` — computed once, fixed for the whole tenure | Some gold-loan / used-vehicle products; rare for term loans, but a real and distinct product type |
| `COMPOUND` | Sub-period compounding at `LoanSettings.compounding` frequency (daily/monthly/quarterly/yearly) within each period — interest-on-interest | Standard annuity (same sizing formula as reducing balance — the *quoted* EMI is still nominal-rate-based even when the underlying accrual compounds) | Less common for retail term loans, but a genuinely different accrual model from reducing-balance, not a relabeling of it |

**Decision order for EMI sizing** (`sizeEmi` in `schedule.ts`): `emiType === INTEREST_ONLY` always wins (EMI = interest accrued that period, principal balloons at the end); otherwise `calculationMethod === SIMPLE` uses the flat formula; otherwise the standard annuity. This used to be buggy — see §9.

Every period accrual routes through `accrueForMethod` (`interest.ts`), which branches on `calculationMethod` and calls either the day-count simple accrual (`accruePeriodInterest`, change-point aware for mid-period disbursements) or the compound sub-period accrual (`accrueCompoundInterest`).

## 3. EMI formulas

- **Annuity** (`computeAnnuityEmi`, `emi.ts`): `EMI = P × r × (1+r)^n / ((1+r)^n − 1)`, where `r` is the installment-sizing rate and `n` the remaining periods. Guards `r = 0` with straight-line `P/n` (the closed form divides by zero otherwise).
- **Flat/add-on** (`computeFlatEmi`): `EMI = (P + P×r×n) / n`.
- **Interest-only** (`computeInterestOnlyEmi`): `EMI = interestAccrued` for that period; full principal is due at the final period.
- **Final-period plug value** (`computeFinalPeriodPayment`): `openingBalance + interestAccrued`. Every EMI computed via a fixed formula and rounded period over period will, over dozens of installments, leave a residual of a few paise due to rounding drift and will essentially never land on exactly zero. The last period is always recomputed as this plug value instead, so the schedule closes at *exactly* zero — matching how real bank systems handle the final installment.

**Prepayment / recalculation policy** (`LoanSettings.prepaymentStrategy`): when an extra/lump-sum payment happens, either `REDUCE_TENURE` (default — EMI stays fixed, the loan just closes earlier) or `REDUCE_EMI` (EMI is recomputed on the reduced balance, tenure stays roughly the same). Real banks default to `REDUCE_TENURE`; both are supported and configurable.

## 4. Moratorium / study period / construction phase

One underlying mechanism, reused for two wizard-facing concepts (Education Loan's "Study Period & Moratorium" and Home Loan's "Construction Phase" — same fields, same engine logic, different step copy only; "moratorium" is standard Indian-banking terminology for a home loan's pre-EMI period too).

**Payment policy** (`MoratoriumInterestPayment`): `NONE` (nothing paid), `FULL` (fully serviced monthly — balance stays flat), `PARTIAL` (a fixed average monthly amount is paid; the shortfall is `interestAccrued − paid`).

**Capitalization** (`Loan.capitalizeUnpaidInterest`, boolean, generalized by `LoanSettings.compounding`): when `true`, the accumulated shortfall folds into the principal balance at a cadence set by `compounding` — `MONTHLY` = every period, `QUARTERLY` = every 3rd period, `YEARLY` = every 12th (`isCapitalizationBoundary`, `moratorium.ts`). Between boundaries the shortfall accumulates uncompounded (`carriedShortfall`). When `false`, the entire moratorium's shortfall is folded in **once**, uncompounded, right when the moratorium ends (`lumpSumCapitalizeAtMoratoriumEnd`). Real banks differ on this cadence (PSU education loans typically capitalize once at moratorium end; some private lenders capitalize quarterly) — this is exactly why it's configurable rather than hardcoded to one behavior.

## 5. Day-count convention

`DayCountConvention`: `DAYS_365` or `DAYS_360`, both using **actual** elapsed calendar days in the numerator (`Actual/365` and `Actual/360` — not a 30-day-per-month `30/360` convention, which no current Indian retail lender the app targets actually uses for INR loans). `DAYS_365` is the default and matches near-universal Indian retail practice; `DAYS_360` exists for products linked to certain treasury/forex-referenced instruments, which is rare for INR retail but kept configurable.

## 6. Missed payments (the most consequential fix)

For any period, the engine must decide what "no payment recorded yet" means, and the answer depends entirely on whether the due date is in the future or the past relative to `today`:

- **Due date in the future** (`periodEnd > today`): this is a genuine projection. An amortization table assumes the planned installment will be paid on time — this is what a bank statement shows you *before* the due date arrives.
- **Due date in the past, still nothing recorded**: this is a real missed payment. The engine does **not** silently advance the balance as if it had been paid — principal isn't reduced, and the unpaid interest is rolled into what's owed (added to the balance) rather than vanishing. Status is `MISSED`.

This used to be a real bug: the engine applied the "assume on-time" logic unconditionally, so a loan showing `MISSED` in month 5 still had month 6's opening balance computed as if month 5's principal had gone through. Fixed in `schedule.ts`'s EMI-phase loop — see the three-way branch on recorded payment / future projection / genuinely missed.

*(Penal interest on a missed payment — real banks often add a rate spread on overdue amounts — is a deliberately deferred gap; see §11.)*

## 7. Existing-loan import

`LoanImportSnapshot` (`asOfDate`, `outstandingPrincipal`, `accruedInterest`) seeds generation for a loan that's already partway through repayment — used **once**, to establish a starting point; the live outstanding balance always comes from the generated `AmortizationEntry` rows afterward, never from the snapshot again.

`buildSeedState` (`import-seed.ts`) resumes from the moratorium or EMI phase based on the loan's `status`, and produces a **stub period**: due dates stay anchored to the *original* day-of-month cadence (from `emiStartDate`), and the first period after import is a short, correctly prorated interval from `asOfDate` to the next aligned due date — not a full nominal period, and not shifted by whatever offset `asOfDate` happens to fall at.

## 8. Loan closure

Tracked as `closureReason` on the schedule result:

- **`NATURAL_MATURITY`**: the loan ran its full nominal `repaymentTenureMonths`.
- **`FORECLOSURE`**: the loan zeroed out early because of an extra/lump-sum payment, before reaching the nominal tenure count.

`regenerateSchedule()` (`src/features/loan-engine/actions.ts`) writes `Loan.status = "CLOSED"` once the schedule has converged **and** the closing entry's due date has actually passed (not merely projected to close in the future) — a loan that's *going to* reach zero next year isn't closed yet just because the projection says so.

## 9. Bugs found and fixed while writing this document

An audit against real banking practice, done before any of the above was implemented, found the previous engine had real silent-correctness bugs, not just missing features:

- **`COMPOUND` was dead code.** `accrueCompoundInterest` existed and was unit-tested but was never called from the schedule generator — every loan was generated as `REDUCING_BALANCE` regardless of this setting.
- **`SIMPLE` only worked by accident.** EMI sizing checked `emiType === "STANDARD"` *before* checking `calculationMethod`, so a user selecting `SIMPLE` with the default `STANDARD` EMI type silently got annuity math instead of flat interest.
- **Capitalization ignored `compounding` entirely.** It was a plain boolean (capitalize every period vs. lump-sum at the end); `QUARTERLY`/`YEARLY` values on the existing field were never consulted.
- **Missed payments were cosmetic.** See §6 — this was the most consequential of the four.

Fixed with no Prisma migration required — every fix reuses fields that already existed in the schema.

## 10. Audit trail & explainability

Every `ScheduleEntry` carries a `breakdown: CalculationBreakdown` — opening balance, rate applied, interest accrual, capitalization (if any), EMI sizing, payment application, and closing balance, each as a `{ key, formula, explanation, value }` step with real numbers substituted into the formula string and a plain-English one-liner. These are built inline, in the same loop iteration that produces the numbers they describe (`explain.ts`'s builder functions, called right after each `compute`/`accrue` call in `schedule.ts`) — never a second derivation pass, so the explanation can never drift from what actually happened.

`buildBalanceAuditChain(entries)` (`audit.ts`) re-expresses the whole schedule as the `opening → interest posted → capitalized → payments → extra payments → closing` waterfall, with a `reconciles` sanity flag per period — pure re-expression of existing entry data, no new math.

`auditSchedule(entries, input, converged)` (`audit.ts`) checks schedule *output* for anomalies (distinct from `validateLoanInputs`, which only checks inputs before generation runs): negative amortization, non-convergence, balance-chain reconciliation mismatches, and a non-zero final balance. Returned as `anomalies: ScheduleAnomaly[]` on the schedule result — surfaced to the user as warnings, never silently swallowed.

Both the calculation drawer and the Loan Details page's "Calculation Audit Mode" are pure renderers of this data — they never compute anything themselves.

## 11. Known gaps, deliberately deferred

Everything below is a real, acknowledged gap — not silently dropped, each with a named home:

- **Interest rate change history.** `Loan.interestRate` is a single scalar; there's no way today to say "6.5% until 2027-04-01, then 7.1%." A floating loan is currently calculated identically to a fixed one. Needs its own `InterestRateChange` model (loan, effective date, rate) and rewiring of the accrual/EMI-sizing loop to look up the rate in effect per-period instead of treating it as a constant. **Scheduled as its own future phase.**
- **Daily interest accrual ledger.** `DailyInterestLog` exists in the schema but nothing populates it — the engine accrues interest once per period (correctly, day-count-weighted), not day-by-day into a persisted ledger. **Already slated for the Phase 10 cron-automation work**, which is specifically about daily accrual.
- **Advance EMI.** Paying the *regular* installment early (before its due date) isn't distinguished from an extra/lump-sum payment today. **Folds into the future Payment Tracker phase**, since it's fundamentally a payment-classification concern.
- **Penal interest on missed payments.** Real banks often charge a rate spread on overdue amounts. Needs a product decision on the penal policy before implementation. **Its own future phase.**

## 12. Configurable-point quick reference

| Setting | Values | Where |
|---|---|---|
| `calculationMethod` | REDUCING_BALANCE / SIMPLE / COMPOUND | `LoanSettings` |
| `compounding` | DAILY / MONTHLY / QUARTERLY / YEARLY | `LoanSettings` — also drives moratorium capitalization cadence |
| `dayCountConvention` | DAYS_365 / DAYS_360 | `LoanSettings` |
| `paymentFrequency` | MONTHLY / QUARTERLY / WEEKLY / BIWEEKLY | `LoanSettings` |
| `prepaymentStrategy` | REDUCE_TENURE / REDUCE_EMI | `LoanSettings` |
| `emiType` | STANDARD / INTEREST_ONLY / FLEXIBLE | `Loan` |
| `moratoriumInterestPayment` | NONE / FULL / PARTIAL | `Loan` |
| `capitalizeUnpaidInterest` | boolean (frequency from `compounding`) | `Loan` |
