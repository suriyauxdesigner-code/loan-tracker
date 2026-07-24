import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function InsightsForecastPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Forecast"
      description="A cross-module financial forecast, once more than Loans feeds into it. For a single loan's forecast, open that loan's own Forecast tab."
    />
  );
}
