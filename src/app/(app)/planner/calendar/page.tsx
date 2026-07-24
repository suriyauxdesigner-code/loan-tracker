import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Calendar"
      description="See every upcoming EMI, bill, and financial deadline in one calendar view once Planner ships."
    />
  );
}
