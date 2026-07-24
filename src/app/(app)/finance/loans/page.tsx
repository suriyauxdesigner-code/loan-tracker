import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getLoansForUser } from "@/features/loans/get-loan";

export default async function LoansListPage() {
  const loans = await getLoansForUser();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
        <Button size="sm" render={<Link href="/finance/loans/new" />}>
          <Plus />
          Add loan
        </Button>
      </div>

      {loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans yet"
          description="Add your first loan to start tracking it against a real amortization schedule."
          action={
            <Button className="mt-2" render={<Link href="/finance/loans/new" />}>
              Add your first loan
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <Link key={loan.id} href={`/finance/loans/${loan.id}`} className="block">
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{loan.loanName}</CardTitle>
                    <Badge variant="secondary">{loan.loanType.replaceAll("_", " ")}</Badge>
                    <Badge variant="outline">{loan.status.replaceAll("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {loan.bankName} · {loan.currency} {loan.principalAmount.toString()}
                  {" · "}
                  {loan._count.amortizationEntries} scheduled entries
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
