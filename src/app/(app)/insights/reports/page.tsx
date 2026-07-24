import { FileText } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Reports"
      description="Export statements and summaries across every module once Reports ships."
    />
  );
}
