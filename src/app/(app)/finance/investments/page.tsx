import { TrendingUp } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function InvestmentsPage() {
  return (
    <ComingSoon
      icon={TrendingUp}
      title="Investments"
      description="Track your investment portfolio once the Investments module ships."
    />
  );
}
