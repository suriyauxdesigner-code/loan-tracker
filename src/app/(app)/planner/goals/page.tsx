import { Target } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function GoalsPage() {
  return (
    <ComingSoon
      icon={Target}
      title="Goals"
      description="Set and track financial goals — like an early payoff target — once Goals ships."
    />
  );
}
