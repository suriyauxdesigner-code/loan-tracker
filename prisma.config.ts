import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This CLI-only URL is used by `prisma migrate`/`studio`, which need a
    // direct connection — Supabase's pgbouncer pooler doesn't support the
    // prepared statements migrations rely on. The app's runtime client
    // (src/lib/db/client.ts) connects with DATABASE_URL (pooled) instead,
    // independent of this config.
    //
    // Read directly from process.env (not the `env()` helper) because that
    // helper throws immediately if the var is unset — and `prisma generate`,
    // which runs in postinstall on every deploy, doesn't need a DB
    // connection at all and shouldn't fail just because DIRECT_URL isn't
    // configured yet in that environment.
    url: process.env.DIRECT_URL,
  },
});
