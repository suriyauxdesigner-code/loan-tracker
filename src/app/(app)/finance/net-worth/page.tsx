import { Scale } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function NetWorthPage() {
  return (
    <ComingSoon
      icon={Scale}
      title="Net Worth"
      description="See assets vs. liabilities in one place once Savings and Investments are tracked alongside Loans."
    />
  );
}
