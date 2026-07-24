import { PiggyBank } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function SavingsPage() {
  return (
    <ComingSoon
      icon={PiggyBank}
      title="Savings"
      description="Track savings accounts and goals once the Savings module ships."
    />
  );
}
