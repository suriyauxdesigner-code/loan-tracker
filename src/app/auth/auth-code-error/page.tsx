import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Sign-in failed
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The sign-in link was invalid or expired.{" "}
        <Link href="/login" className="underline">
          Try again
        </Link>
        .
      </p>
    </main>
  );
}
