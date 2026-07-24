import { generateSchedule } from "@/lib/loan-engine";
import { mapLoanToEngineInput } from "@/features/loan-engine/map-to-engine-input";
import { getLoanForUser } from "@/features/loans/get-loan";
import { computeLoanMetrics } from "@/features/loans/metrics";
import { buildForecastSeries } from "@/features/loans-forecast/forecast";
import { ForecastCharts } from "@/features/loans-forecast/components/forecast-charts";

export default async function LoanForecastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoanForUser(id);

  const input = mapLoanToEngineInput(loan);
  const result = generateSchedule(input);

  const now = new Date();
  const metrics = computeLoanMetrics(
    result.entries,
    loan.principalAmount,
    result.anomalies,
    result.closureReason,
    now,
  );
  const forecastSeries = buildForecastSeries(result.entries, now);
  const totalInterestPayable = result.entries.reduce(
    (sum, e) => sum + e.interestAccrued.toNumber(),
    0,
  );
  const todayMonthIndex = metrics.currentEntry
    ? forecastSeries.findIndex((p) => p.monthIndex === metrics.currentEntry!.monthIndex)
    : null;

  return (
    <ForecastCharts
      series={forecastSeries}
      currency={loan.currency}
      totalInterestPayable={totalInterestPayable}
      todayMonthIndex={todayMonthIndex != null && todayMonthIndex >= 0 ? todayMonthIndex : null}
    />
  );
}
