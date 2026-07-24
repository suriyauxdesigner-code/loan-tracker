# Loan Tracker

Personal education loan management app. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the stack, folder structure, and the Prisma 7 / Supabase connection setup.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
npm run test      # loan-engine unit tests (Vitest)
npm run lint
npm run format
```

Copy `.env.example` to `.env` and fill in real values once the accounts below exist.

## Account setup checklist

None of these existed when this project started. Do these once, in order — everything after Phase 2 depends on them.

### 1. GitHub

1. Create a new **private** repo (e.g. `loan-tracker`) at github.com/new.
2. From this project directory:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### 2. Supabase (database + auth)

1. Create a free account/project at supabase.com.
2. **Project Settings → Database → Connection string**:
   - Copy the **Transaction pooler** string (port 6543) → `DATABASE_URL` in `.env`. Append `?pgbouncer=true` if not already present.
   - Copy the **Direct connection** string (port 5432) → `DIRECT_URL` in `.env`.
3. **Project Settings → API**: copy the Project URL → `NEXT_PUBLIC_SUPABASE_URL`, and the `anon`/`public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Authentication → Sign In / Providers → Google**: enable it (needs the Google OAuth client from step 3 below — create that first, then come back here to paste the Client ID/Secret).
5. Once `.env` is filled in, run:
   ```bash
   npm run db:migrate -- --name init
   ```
   This creates the tables in Supabase from `prisma/schema.prisma`.

### 3. Google OAuth client (for Supabase Auth)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 Client ID (type: Web application).
2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows you this exact value on its Google provider setup screen).
3. Paste the Client ID and Client Secret into Supabase's Google provider settings (step 2.4 above).
4. Only `ALLOWED_EMAIL` in `.env` will pass the app's middleware check after login — anyone else's Google account can authenticate with Supabase but will be rejected by the app.

### 4. Vercel (hosting + cron)

1. Import the GitHub repo at vercel.com/new.
2. Add every variable from `.env` to the Vercel project's Environment Variables.
3. Deployment happens automatically on push to `main` — set up in a later phase (10) once the cron jobs exist.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run test` | Run loan-engine unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (writes) |
| `npm run db:generate` | Regenerate the Prisma client after a schema change |
| `npm run db:migrate` | Create/apply a migration (needs `DIRECT_URL` set) |
| `npm run db:studio` | Browse the database with Prisma Studio |
