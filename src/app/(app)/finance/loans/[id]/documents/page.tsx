import { FileText } from "lucide-react";
import { ComingSoon } from "@/features/shell/components/coming-soon";

export default function LoanDocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Store your sanction letter, agreement, and statements against this loan once Documents ships."
    />
  );
}
