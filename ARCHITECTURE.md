# Architecture

Personal, single-user Education Loan Management app. Not multi-tenant — built for one Google account, with a schema that supports more than one loan per account.

## Roadmap (MVP-first)

1. ~~Requirements validation~~
2. **Architecture + scaffold + account setup** ← current
3. Database schema (Prisma, MVP tables)
4. Auth (Supabase + Google OAuth, email allowlist)
5. Loan Setup Wizard
6. Loan calculation engine (unit-tested, framework-agnostic)
7. Amortization engine
8. Payment tracker
9. Core dashboard
10. Daily/monthly cron automation (interest accrual)
    — MVP usable here —
11. Reports (PDF/CSV/Excel)
12. Deep analytics
13. Calendar view
14. Notifications
15. Hardening + final deployment

## Stack

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** — single deployable, no separate backend service.
- **Prisma 7** (driver-adapter based, ESM client) **+ Supabase Postgres** — see "Prisma 7 connection model" below, it differs from older Prisma versions.
- **Supabase Auth** (Google provider) for login, restricted to one allowlisted email.
- **Vercel** hosting + Vercel Cron for the daily/monthly interest jobs.
- **Vitest** for engine unit tests, **Prettier** for formatting.

## Folder structure

```
src/
  app/                     # Next.js routes, layouts, Server Actions, Route Handlers
  components/ui/           # shadcn/ui primitives (generated, don't hand-edit heavily)
  features/
    loan-setup/            # setup wizard UI + its Server Actions
    payments/               # payment tracker UI
    dashboard/              # dashboard UI
  lib/
    loan-engine/            # pure TS: interest/amortization math, zero framework imports
    db/                     # Prisma client singleton
    supabase/                # Supabase client helpers (browser + server)
  generated/prisma/          # generated Prisma client (gitignored, regenerate with `npm run db:generate`)
prisma/
  schema.prisma
  migrations/
```

**Why `loan-engine` is isolated in `lib`, not `features`:** it's the one part of this app that has to be *correct* — real interest math, moratorium handling, day-count conventions. Keeping it framework-agnostic (no Next.js, no Prisma types) means it can be unit-tested directly with Vitest, and swapped/refactored without touching UI or DB code. Server Actions in `features/*` call into it and handle persistence.

## Prisma 7 connection model (important, differs from Prisma 5/6)

Prisma 7 dropped the Rust query engine binary — the client is a thin ESM wrapper that requires an explicit **driver adapter** (`@prisma/adapter-pg` + `pg` here). Connection URLs also moved out of `schema.prisma` entirely into `prisma.config.ts`.

This app uses **two different Postgres connection strings**, both from Supabase:

- `DATABASE_URL` — the **pooled** connection (pgbouncer, port 6543). Used by the app at runtime (`src/lib/db/client.ts`), since serverless functions open/close connections constantly and need pooling.
- `DIRECT_URL` — the **direct** connection (port 5432). Used only by the Prisma CLI (`prisma migrate`, `prisma studio`) via `prisma.config.ts`, because Supabase's pooler runs in transaction mode and doesn't support the prepared statements migrations need.

These are independent: `prisma.config.ts` only affects CLI commands, not the app's own `PrismaClient` instantiation.

## Money and dates

- All monetary fields are Postgres `Decimal(18,2)`, mapped through Prisma's `Decimal` type. The loan engine uses `decimal.js` internally — never native floats for interest/principal math.
- Date arithmetic (day-count conventions, month-end handling) uses `date-fns`.

## Known accepted risk

`npm audit` reports vulnerabilities in transitive dependencies of dev-only tooling (Prisma's local dev/studio server, shadcn's CLI/MCP bundle) and in Next.js's own vendored `postcss`/`sharp`. `npm audit fix --force` would downgrade Next.js to an ancient version to "fix" this, which is wrong — left as-is and revisited if Next/Prisma/shadcn ship patched releases.
