import { Receipt } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function RepaymentTrackerPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Repayment Tracker"
      description="Record and reconcile payments against this loan once the Payment Tracker ships."
    />
  );
}
