import { Receipt } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function ExpensesPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Expenses"
      description="Track and categorize your monthly spending once the Expenses module ships."
    />
  );
}
