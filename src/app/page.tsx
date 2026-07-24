import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server-client";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const user = authUser?.email
    ? await prisma.user.findUnique({
        where: { email: authUser.email },
        include: {
          loans: { include: { _count: { select: { amortizationEntries: true } } } },
        },
      })
    : null;

  if (!user || user.loans.length === 0) {
    redirect("/loans/new");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your loans
        </h1>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {user.loans.map((loan) => (
          <Link key={loan.id} href={`/loans/${loan.id}`} className="block">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{loan.loanName}</CardTitle>
                  <Badge variant="secondary">{loan.loanType}</Badge>
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

      <Button
        variant="outline"
        className="w-fit"
        render={<Link href="/loans/new" />}
      >
        Add another loan
      </Button>
    </main>
  );
}
