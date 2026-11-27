# Victorious Residence

Production hostel inventory, resident booking, and payment-review system.

**Version:** `0.5.0` · **Stack:** Next.js · Drizzle · PostgreSQL (Neon) · Auth.js · Tailwind · Resend

## What's in `0.5.0`

- Cancel residence / booking and upgrade or change rooms (resident + staff)
- Resident ID card photo uploads (Ghana Card / student ID); staff can view on resident detail
- Brand logos, favicons, and email wordmark
- Git + Neon `development` workflow with sync Action to `master`
- Everything from `0.4.0` (public site, campuses/staff, deposit booking, balances, audit, profile)

## Branches

| Git | Neon | Purpose |
| :--- | :--- | :--- |
| `development` | `development` | Local development |
| `master` | production / staging | Deployed staging & production |

After a `development` → `master` merge (or any push to `master`), Actions resets `development` to match `master`. Details: [`docs/local-development.md`](./docs/local-development.md).

## Setup

1. Use the Git `development` branch and Neon **development** DB branch (not production):

```bash
git checkout development
cp .env.example .env.local
```

2. Set `DATABASE_URL` to the Neon **development** connection string, plus `AUTH_SECRET` (`openssl rand -base64 32`).

3. Sync schema and seed demo data:

```bash
npm run db:sync
npm run db:seed
```

4. Start the app (local port **17017**):

```bash
npm run dev
```

Open http://localhost:17017

### Demo users (after seed)

| Email | Role | Password |
| :--- | :--- | :--- |
| `admin@victorious.local` | ADMIN | `ChangeMe123!` |
| `manager@victorious.local` | MANAGER | `ChangeMe123!` |
| `staff@victorious.local` | STAFF | `ChangeMe123!` |
| `resident@victorious.local` | RESIDENT | `ChangeMe123!` |

## Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Local Next.js server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to Neon (dev) |
| `npm run db:migrate` | Apply migrations (clean history) |
| `npm run db:sync` | Apply / record migrations safely after `db:push` hybrids |
| `npm run db:seed` | Seed residence, users, room types, beds |
| `npm run db:seed:migrate` | Run idempotent content/seed migrations |
| `npm run db:studio` | Drizzle Studio |

## Docs

- [`CHANGELOG.md`](./CHANGELOG.md) — release history
- [`docs/PLAN.md`](./docs/PLAN.md) — architecture and phased delivery
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — post-launch backlog
- [`docs/project-proposal.md`](./docs/project-proposal.md) — client scope
- [`docs/proposed-invoice.md`](./docs/proposed-invoice.md) — commercial terms
- [`docs/training-checklist.md`](./docs/training-checklist.md) — staff go-live checklist
- [`docs/public-showcase-design.md`](./docs/public-showcase-design.md) — public site design notes
- [`docs/social-profile-copy.md`](./docs/social-profile-copy.md) — social bios / About copy
