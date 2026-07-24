import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server-client";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Loan Tracker</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Signed in as {user?.email}. The setup wizard and dashboard land in the
        next phases.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
