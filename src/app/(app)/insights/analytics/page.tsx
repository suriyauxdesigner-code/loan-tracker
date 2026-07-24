import { LineChart } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      icon={LineChart}
      title="Analytics"
      description="Cross-module spending and repayment analytics, once more than one module has real data."
    />
  );
}
