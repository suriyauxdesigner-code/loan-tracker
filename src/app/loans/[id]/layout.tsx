import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLoanForUser } from "@/features/loan-details/get-loan";
import { LoanTabs } from "@/features/loan-details/components/loan-tabs";

export default async function LoanLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const loan = await getLoanForUser(id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/" />}>
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{loan.loanName}</h1>
            <Badge variant="secondary">{loan.loanType.replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{loan.status.replaceAll("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {loan.bankName}
            {loan.loanAccountNumber ? ` · ${loan.loanAccountNumber}` : ""}
          </p>
        </div>
      </div>

      <LoanTabs loanId={id} />

      {children}
    </main>
  );
}
