# Victorious Residence — Architecture & Build Plan

**Stack:** Next.js 16 (App Router) · TypeScript · Drizzle ORM · PostgreSQL · Auth.js (Credentials) · Tailwind · Vercel + Neon  
**Target launch:** Last week of November 2026 (production)  
**Payment model (launch):** Manual proof-of-payment review — schema gateway-ready for live MoMo/bank later  
**Repo:** https://github.com/Nuestman/victorious-residence

---

## Progress (as of 2026-11-26 · app `0.4.0`)

### Done — Phase 0 Foundation
- [x] Next.js + TypeScript + Tailwind app scaffold
- [x] Neon Postgres project + Drizzle schema (all core tables, enums, indexes)
- [x] Initial migration (`drizzle/0000_init.sql`) + `db:push` / `db:seed`
- [x] Auth.js credentials login/logout for `RESIDENT` / `MANAGER` / `ADMIN`
- [x] Role-gated middleware for `/resident`, `/manager`, `/admin`
- [x] Env template (`.env.example`); local `.env.local` (gitignored)
- [x] Seed: 1 residence, 3 demo users, 3 room types, rooms + 22 bed spaces
- [x] Portal shells with live read-only counts (availability / occupancy / room types)

### Done — Phase 1 Inventory CMS
- [x] Admin RoomType CRUD (create / edit / deactivate) — `/admin/room-types`
- [x] Bulk provision N rooms of a type (auto-create bed spaces by capacity) — `/admin/provision`
- [x] Occupancy board (room → bed matrix) — `/admin/occupancy`
- [x] Shared availability / occupancy query helpers — `src/server/queries/availability.ts`

### Done — Phase 2 Resident booking
- [x] Public landing live availability counters
- [x] Resident browse / choose bed
- [x] Deposit-based reservation (≥ GHS 1,000 non-refundable) — bed locks on deposit proof
- [x] Payment reference + receipt upload + `amount_paid`
- [x] My bookings
- [x] Cron: expire unpaid applications only (`/api/cron/expire-bookings`)

### Done — Phase 3 Manager workflow
- [x] Review queue (`/manager/reviews`)
- [x] Approve / Reject with audit log (`/manager/reviews/[id]`)
- [x] Dashboard counts + ready-to-review preview
- [x] Race-safe approve/reject (`UPDATE … WHERE payment_status = 'PENDING'`)
- [x] Payment balances + reminder emails (`/manager/balances`)

### Done — Phase 4 Hardening & launch (partial)
- [x] Resident self-registration (`/register`)
- [x] Staff training checklist (`docs/training-checklist.md`)
- [x] Residents list + detail in manager and admin portals
- [x] User profile (`/profile`) + enriched resident fields
- [x] Public showcase site + contact / inquiries + Resend mail
- [x] Admin audit log UI (`/admin/audit`)
- [ ] Soft launch UAT with Victorious management
- [ ] Change demo passwords / production secrets hygiene
- Deferred (scale later): S3/Vercel Blob for receipts — **data URLs in `bookings.receipt_url` for launch**

---

## 1. Product decisions (locked)

| Decision          | Choice                                                         | Why                                                                    |
| :---------------- | :------------------------------------------------------------- | :--------------------------------------------------------------------- |
| ORM               | **Drizzle**                                                    | Typed SQL, fast migrations, excellent Neon fit                         |
| Room layouts      | **CMS-driven** `RoomType`                                      | Admin defines “1-bed”, “2-in-1”, “4-in-1”, etc. — no hardcoded filters |
| Inventory unit    | **BedSpace**                                                   | Availability, holds, and occupancy are always per bed                  |
| Payments (launch) | ≥ GHS 1,000 non-refundable deposit → reserve → manager review  | Schema still gateway-ready for live MoMo/bank later                    |
| Tenancy           | Multi-residence UI (Phase 5); schema via `residenceId`         | Admin CRUD campuses + working-campus switcher                          |
| Auth              | Auth.js credentials + role-gated middleware                    | Simple for Ghana hostel ops; no OAuth dependency                       |
| Media / receipts  | **Launch:** data URLs in Postgres (≤1.5MB). **Later:** S3/Blob | Ship without storage vendor; upgrade when volume grows                 |

---

## 2. Domain model

```
Residence 1──* RoomType
Residence 1──* Room
RoomType  1──* Room
Room      1──* BedSpace
User (RESIDENT) 1──* Booking
BedSpace  1──* Booking   (history; at most one active PENDING/SUCCESS)
Manager/Admin review Bookings → mutate BedSpace.status
```

### 2.1 Enums

```ts
export const userRoleEnum = pgEnum("user_role", ["RESIDENT", "MANAGER", "ADMIN"]);
export const bedSpaceStatusEnum = pgEnum("bed_space_status", [
  "AVAILABLE",
  "PENDING_PAYMENT",
  "OCCUPIED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
]);
```

### 2.2 Tables

`users`

- `id` uuid PK  
- `email` unique, `passwordHash`, `fullName`, `phone`  
- `role` user_role (default `RESIDENT`)  
- `residenceId` nullable FK (managers scoped to a residence; ADMIN global)  
- `createdAt`, `updatedAt`  
- Index: `(email)`, `(role)`, `(residenceId)`

`residences`

- `id`, `name`, `slug` unique, `address`, `description`, `heroImageUrl`, `isActive`  
- Media gallery via `residence_media` (id, residenceId, url, sortOrder, caption)

`room_types` (flexible CMS inventory definition)

- `id`, `residenceId` FK  
- `name` — e.g. “Standard 2-in-1”, “Executive Single”  
- `capacity` int — beds per room (1, 2, 4, …)  
- `pricePerBed` decimal(12,2) — GHS  
- `description`, `amenities` jsonb, `coverImageUrl`  
- `isActive`, `sortOrder`  
- Unique: `(residenceId, name)`  
- Index: `(residenceId, isActive)`

`rooms`

- `id`, `residenceId` FK, `roomTypeId` FK  
- `label` — e.g. “A12”, “Block B · 03”  
- `floor` nullable int, `isActive`  
- Unique: `(residenceId, label)`  
- Index: `(residenceId, roomTypeId, isActive)`

`bed_spaces`

- `id`, `roomId` FK  
- `label` — e.g. “A”, “B”, “1”, “2” (within the room)  
- `status` bed_space_status default `AVAILABLE`  
- `activeBookingId` nullable FK → bookings  
- Unique: `(roomId, label)`  
- **Critical indexes for availability:**
  - `(status)` partial where `status = 'AVAILABLE'`  
  - `(roomId, status)`

`bookings` (transaction / hold ledger)

- `id`  
- `residentId` → users  
- `bedSpaceId` → bed_spaces  
- `residenceId` → residences (denormalized for admin queues)  
- `amount` decimal(12,2)  
- `paymentReference` text nullable  
- `paymentStatus` payment_status default `PENDING`  
- `receiptUrl` text nullable  
- `expiresAt` timestamptz  
- `reviewedById` nullable → users  
- `reviewedAt` nullable, `reviewNote` nullable  
- `createdAt`, `updatedAt`  
- Indexes: `(paymentStatus, expiresAt)`, `(residenceId, paymentStatus)`, `(residentId, createdAt)`, `(bedSpaceId, paymentStatus)`

`audit_logs`

- `id`, `actorId`, `action`, `entityType`, `entityId`, `metadata` jsonb, `createdAt`  
- Index: `(entityType, entityId)`, `(createdAt)`

### 2.3 Inventory provisioning flow (admin CMS)

1. Admin creates a **RoomType** (`name`, `capacity`, `pricePerBed`, copy/media).
2. Admin **provisions rooms**: “Create 6 rooms of type Standard 2-in-1, labels A01–A06”.
3. System inserts 6 `rooms` + `capacity` bed spaces each.
4. UIs aggregate available beds grouped by `room_type`.
5. Changing capacity on an existing type does **not** retro-mutate beds; admin adds/removes rooms or beds explicitly.

### 2.4 Booking state machine

```
AVAILABLE ──apply (no lock)──► deposit ≥ GHS 1000 proof ──► PENDING_PAYMENT ──approve──► OCCUPIED
                                      │                              │
                                      └──bed taken first──► fail     └──reject──► AVAILABLE
Unpaid applications (no deposit) close after abandon window; deposit reservations are not timed out.
```

**Concurrency:** transactional `UPDATE bed_spaces … WHERE status = 'AVAILABLE' RETURNING` * on deposit submit; zero rows ⇒ “just taken”.

---

## 3. Application architecture

```
├── app/
│   ├── (public)/          landing, galleries, live availability by room type
│   ├── (auth)/            login, register (resident)
│   ├── (resident)/        browse types → pick bed → pay proof → my bookings
│   ├── (manager)/         review queue, approve/reject, occupancy board
│   └── (admin)/           residences, room types, bulk provision rooms, users
├── server/
│   ├── db/                drizzle schema, client, migrations
│   ├── actions/           server actions (book, review, provision)
│   ├── auth/              Auth.js config + role helpers
│   └── jobs/              expire-pending-bookings (cron)
├── components/
└── lib/                   money, labels, validators (zod)
```

**Route protection:** middleware by role. `ADMIN` ⊃ `MANAGER` for residence ops; `ADMIN` alone for CMS structure & user roles.  
**API:** Server Actions + RSC; Route Handlers for upload callbacks, cron, future webhooks.

---

## 4. Feature modules

| Module | Production deliverables |
| :--- | :--- |
| **Public Showcase** | Landing, amenities/media, live available bed counts by RoomType |
| **Resident Ledger** | Register/login, filter by type/price/availability, hold bed, payment ref + receipt, booking status |
| **Management Panel** | PENDING queue, approve/reject, occupancy matrix, audit trail |
| **Admin CMS** | Residences CRUD, room types, bulk provision, occupancy, staff/managers, residents |

**Follow-on backlog:** see [ROADMAP.md](./ROADMAP.md) (campuses/staff P0, payments, tickets, storage, etc.).

---

## 5. Phased delivery

### Phase 0 — Foundation ✅

- [x] Next.js + Tailwind  
- [x] Neon Postgres + Drizzle schema, migrate, seed  
- [x] Auth.js credentials, role middleware  
- [x] Env template  
- [x] Seed: 1 residence, ADMIN + MANAGER + RESIDENT, sample types/rooms/beds  
- [x] Login/logout verified for all three roles; portals open with live DB reads  

### Phase 1 — Inventory CMS ✅ (UI shipped; UAT in progress)

- [x] RoomType CRUD  
- [x] Bulk provision N rooms of type X  
- [x] Occupancy board  
- [x] Shared availability query helpers  

### Phase 2 — Public + Resident booking ✅ (manager review still Phase 3)

- [x] Public landing + live counters  
- [x] Resident browse/filter  
- [x] Atomic bed hold + `expiresAt`  
- [x] Receipt upload + payment reference  
- [x] My bookings  
- [x] Cron: expire stale PENDING  

### Phase 3 — Manager workflow ✅

- [x] Review queue  
- [x] Approve / Reject + audit log  
- [x] Dashboard counts + ready-to-review list  
- [x] Race-safe approve/reject  

### Phase 4 — Hardening & launch

- [x] Resident registration  
- [x] Training checklist  
- [x] Neon + Vercel staging (production secrets / soft launch remaining)  
- [x] Profile, public site, contact inbox, audit UI, balances/reminders (shipped in `0.4.0`)  
- [ ] Soft launch UAT → December intake  
- Deferred: object-storage receipts, broader automated access-control suite  

### Phase 5 — Campuses & staff (P0 on [ROADMAP.md](./ROADMAP.md)) ✅

- [x] Admin residences CRUD (`/admin/residences`)  
- [x] Admin working-campus switcher (inventory scoped per residence)  
- [x] `STAFF` role + staff directory for admin and manager  
- [x] Role rules: manager/admin CRUD staff; only admin assigns `MANAGER`  
- [x] Seed demo staff user; stop primary-residence-only helpers  

### Phase 6 — Ops polish (partial in `0.4.0`)

- [x] Deposit reservation + balance tracking + payment reminder email  
- [x] Admin audit trail UI  
- [ ] Soft-launch UAT / secret hygiene (ROADMAP P1)  

---

## 6. Key queries

**Available beds by room type:**

```sql
SELECT rt.id, rt.name, rt.capacity, rt.price_per_bed,
       COUNT(bs.id) FILTER (WHERE bs.status = 'AVAILABLE') AS available_beds
FROM room_types rt
JOIN rooms r ON r.room_type_id = rt.id AND r.is_active = true
JOIN bed_spaces bs ON bs.room_id = r.id
WHERE rt.residence_id = $1 AND rt.is_active = true
GROUP BY rt.id
ORDER BY rt.sort_order;
```

**Atomic hold:**

```sql
UPDATE bed_spaces
SET status = 'PENDING_PAYMENT', updated_at = now()
WHERE id = $1 AND status = 'AVAILABLE'
RETURNING *;
```

---

## 7. Security & ops

- Passwords: bcrypt via Auth.js  
- Receipts (launch): data URLs in DB; Blob/S3 when scaling  
- Never trust client `amount` — copy from `room_types.pricePerBed` at booking time  
- Cron secret header for expire job  
- Neon PITR backups  
- Follow-on: rate-limit register/login 

---

## 8. Bootstrap order

1. ~~Init Next.js + deps~~ ✅  
2. ~~`drizzle.config.ts` + full schema~~ ✅  
3. ~~Migration + seed~~ ✅  
4. ~~Auth + role middleware~~ ✅  
5. ~~Admin CMS~~ ✅ → ~~Resident booking~~ ✅ → ~~Manager review~~ ✅ → ~~Hardening~~ ✅ → ~~Campuses & staff~~ ✅ → **UAT / ROADMAP P1+** (`0.4.0` shipped)
