"use client";

import type { UseFormReturn } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { LoanType } from "@/generated/prisma/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateLoanInputs } from "@/lib/loan-engine";
import { mapFormToEngineInput } from "../map-to-engine";
import type { LoanSetupValues } from "../schema";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function StepReview({
  form,
}: {
  form: UseFormReturn<LoanSetupValues>;
}) {
  const values = form.watch();
  const warnings = validateLoanInputs(mapFormToEngineInput(values));
  const errors = warnings.filter((w) => w.severity === "error");
  const cautions = warnings.filter((w) => w.severity === "warning");

  return (
    <div className="space-y-4">
      {(errors.length > 0 || cautions.length > 0) && (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="size-4" /> Before you create this loan
          </div>
          <ul className="space-y-1 text-sm">
            {errors.map((w) => (
              <li key={w.code} className="text-destructive">
                {w.message}
              </li>
            ))}
            {cautions.map((w) => (
              <li key={w.code} className="text-muted-foreground">
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loan summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Row label="Loan" value={`${values.loanName} — ${values.bankName}`} />
          <Row label="Type" value={values.loanType} />
          <Row
            label="Principal"
            value={`${values.currency} ${values.principalAmount || "—"}`}
          />
          <Row
            label="Interest rate"
            value={`${values.interestRate || "—"}% (${values.interestType})`}
          />
          <Row label="EMI type" value={values.emiType} />
          <Row label="Tenure" value={`${values.loanTenureMonths} months`} />
        </CardContent>
      </Card>

      {values.loanType !== LoanType.PERSONAL && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disbursement summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row
              label="Disbursements"
              value={`${values.disbursements.length} entr${
                values.disbursements.length === 1 ? "y" : "ies"
              }`}
            />
            <Row
              label="Total disbursed"
              value={`${values.currency} ${values.disbursements
                .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
                .toLocaleString()}`}
            />
          </CardContent>
        </Card>
      )}

      {values.hasMoratorium && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {values.loanType === LoanType.HOME
                ? "Construction phase summary"
                : "Moratorium summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row
              label="Period"
              value={`${values.moratoriumStartDate || "—"} → ${values.moratoriumEndDate || "—"}`}
            />
            <Row
              label="Interest handling"
              value={values.moratoriumInterestPayment}
            />
            <Row
              label="Capitalize unpaid interest"
              value={values.capitalizeUnpaidInterest ? "Yes" : "No"}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Row label="Loan status" value={values.status} />
          <Row
            label="Existing loan"
            value={values.isExistingLoan ? "Yes" : "No"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
