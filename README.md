# Victorious Residence

Production hostel inventory, resident booking, and payment-review system.

**Version:** `0.4.0` · **Stack:** Next.js · Drizzle · PostgreSQL (Neon) · Auth.js · Tailwind · Resend

## What's in `0.4.0`

- Public hospitality site (rooms, facilities, gallery, about, contact)
- Multi-residence admin CMS + working-campus switcher
- `STAFF` role and staff directories (admin + manager)
- Deposit-based bed reservation (≥ GHS 1,000 non-refundable)
- Payment balances + reminder emails
- User profile (IDs, hometown, emergency contact, avatar, password)
- Admin audit log UI
- App version in portal sidebar footer

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
