import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { getLoanForUser } from "@/features/loans/get-loan";
import { serializeEntries } from "@/features/loans/serialize";
import { ScheduleTable } from "@/features/loans/components/schedule-table";

export default async function LoanSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoanForUser(id);

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);
  const entries = serializeEntries(result.entries);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly EMI Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <ScheduleTable entries={entries} currency={loan.currency} />
      </CardContent>
    </Card>
  );
}
