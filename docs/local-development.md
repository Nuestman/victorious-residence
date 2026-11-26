# Local development (Git + Neon)

## Branch model

| Git branch | Neon branch | Use |
| :--- | :--- | :--- |
| `development` | `development` | Day-to-day local work |
| `master` (default) | production / staging Neon branch | Staging + production deploys |

Work on `development`, open a PR into `master` when ready for staging.  
After that PR merges (or any push to `master`), GitHub Actions resets `development` to match `master` so the branches do not drift ahead/behind.

Manual sync: **Actions → Sync development with master → Run workflow**.

## One-time local setup

1. Check out the Git branch:

```bash
git fetch origin
git checkout development
git pull
```

2. In the [Neon console](https://console.neon.tech), open this project → branch **`development`** → **Connection details** → copy the pooled connection string.

3. Point local env at that branch (keep production/staging URLs only in Vercel):

```bash
cp .env.example .env.local
```

Set in `.env.local`:

```env
DATABASE_URL=<Neon development branch connection string>
AUTH_SECRET=<openssl rand -base64 32>
CRON_SECRET=<random secret>
```

Optional Resend keys work the same as staging.

4. Align schema + seed:

```bash
npm run db:sync
npm run db:seed
# optional content fixes:
npm run db:seed:migrate
```

5. Run the app:

```bash
npm run dev
```

Open http://localhost:17017

## Day-to-day

- Commit on `development`, push, open PR → `master` for staging.
- Do **not** point `.env.local` at the production Neon branch while experimenting.
- Wipe booking test data: `node scripts/clear-bookings.mjs` (uses whatever `DATABASE_URL` is in `.env.local`).

## Neon notes

- Neon `development` is an isolated copy of data/schema at branch creation time; schema changes you apply locally (via `db:sync` / `db:migrate`) land only on that branch until you promote the matching Git migrations through `master` and migrate staging/production.
- After creating a fresh Neon development branch, always run `npm run db:sync` once from a machine whose `.env.local` points at it.
