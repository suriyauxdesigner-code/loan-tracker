import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";

export function LoanProgress({
  principalProgressPct,
  interestProgressPct,
  completionPct,
}: {
  principalProgressPct: number;
  interestProgressPct: number;
  completionPct: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Loan Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <CircularProgress value={completionPct} label="Completed" />
        <div className="flex-1 space-y-4">
          <Progress value={principalProgressPct}>
            <div className="flex justify-between">
              <ProgressLabel>Principal Repaid</ProgressLabel>
              <ProgressValue />
            </div>
          </Progress>
          <Progress value={interestProgressPct}>
            <div className="flex justify-between">
              <ProgressLabel>Interest Paid (of total payable)</ProgressLabel>
              <ProgressValue />
            </div>
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
}
