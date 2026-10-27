# Victorious Residence

Production hostel inventory, resident booking, and payment-review system.

**Stack:** Next.js · Drizzle · PostgreSQL (Neon) · Auth.js · Tailwind

## Setup

1. Copy env template and fill values:

```bash
cp .env.example .env.local
```

2. Set `DATABASE_URL` (Neon) and `AUTH_SECRET` (`openssl rand -base64 32`).

3. Push schema and seed demo data:

```bash
npm run db:push
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
| `resident@victorious.local` | RESIDENT | `ChangeMe123!` |

## Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Local Next.js server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to Neon (dev) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed residence, users, room types, beds |
| `npm run db:studio` | Drizzle Studio |

## Docs

- [`CHANGELOG.md`](./CHANGELOG.md) — release history
- [`docs/PLAN.md`](./docs/PLAN.md) — architecture and phased delivery
- [`docs/project-proposal.md`](./docs/project-proposal.md) — client scope
- [`docs/proposed-invoice.md`](./docs/proposed-invoice.md) — commercial terms
- [`docs/training-checklist.md`](./docs/training-checklist.md) — staff go-live checklist
