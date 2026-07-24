import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";

/** Single shared primitive for "who is the signed-in user" across every
 * Server Component loader — cache()-wrapped so it dedupes within a
 * request instead of every loader re-deriving it independently. Routes
 * reaching here are already known-authenticated by proxy.ts, so this
 * redirect is a defensive backstop, not the primary auth gate. */
export const getCurrentUserEmail = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) redirect("/login");
  return authUser.email;
});
