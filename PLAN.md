# Victorious Residence — Architecture & Build Plan

**Stack:** Next.js 16 (App Router) · TypeScript · Drizzle ORM · PostgreSQL · Auth.js (Credentials) · Tailwind · Vercel + Neon  
**Target launch:** Last week of November 2026 (production)  
**Payment model (launch):** Manual proof-of-payment review — schema gateway-ready for live MoMo/bank later  
**Repo:** https://github.com/Nuestman/victorious-residence

---

## Progress (as of 2026-10-27)

### Done — Phase 0 Foundation
- [x] Next.js + TypeScript + Tailwind app scaffold
- [x] Neon Postgres project + Drizzle schema (all core tables, enums, indexes)
- [x] Initial migration (`drizzle/0000_init.sql`) + `db:push` / `db:seed`
- [x] Auth.js credentials login/logout for `RESIDENT` / `MANAGER` / `ADMIN`
- [x] Role-gated middleware for `/resident`, `/manager`, `/admin`
- [x] Env template (`.env.example`); local `.env.local` (gitignored)
- [x] Seed: 1 residence, 3 demo users, 3 room types, rooms + 22 bed spaces
- [x] Portal shells with live read-only counts (availability / occupancy / room types)

### Next — Phase 1 Inventory CMS (this slice)
- [ ] Admin RoomType CRUD (create / edit / deactivate)
- [ ] Bulk provision N rooms of a type (auto-create bed spaces by capacity)
- [ ] Occupancy board (room → beds matrix)
- [ ] Harden availability aggregation helpers used by public/resident later

### Not started
- Phase 2 Public + resident booking hold / receipt upload  
- Phase 3 Manager approve/reject queue  
- Phase 4 Hardening, Vercel production, training  

---

## 1. Product decisions (locked)

| Decision          | Choice                                                         | Why                                                                    |
| :---------------- | :------------------------------------------------------------- | :--------------------------------------------------------------------- |
| ORM               | **Drizzle**                                                    | Typed SQL, fast migrations, excellent Neon fit                         |
| Room layouts      | **CMS-driven** `RoomType`                                      | Admin defines “1-bed”, “2-in-1”, “4-in-1”, etc. — no hardcoded filters |
| Inventory unit    | **BedSpace**                                                   | Availability, holds, and occupancy are always per bed                  |
| Payments (launch) | Upload receipt → manager approve/reject                        | Matches out-of-scope; schema still gateway-ready                       |
| Tenancy           | Single residence seeded; schema multi-tenant via `residenceId` | Future campuses without rewrite                                        |
| Auth              | Auth.js credentials + role-gated middleware                    | Simple for Ghana hostel ops; no OAuth dependency                       |
| Media             | S3-compatible object storage for galleries + receipts          | Receipts must be durable and private                                   |

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
AVAILABLE ──select──► PENDING_PAYMENT ──manager approve──► OCCUPIED
                │                              │
                │ upload receipt               │
                │                              ▼
                ├──manager reject──► AVAILABLE (+ booking FAILED)
                └──expiresAt passed──► AVAILABLE (+ booking FAILED, system)
```

**Concurrency:** transactional `UPDATE bed_spaces … WHERE status = 'AVAILABLE' RETURNING` *; zero rows ⇒ “just taken”.

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
| **Admin CMS** | Room types CRUD, bulk room+bed provisioning, residence profile/media, promote managers |

**Follow-on phase:** live MoMo/bank APIs, maintenance tickets, multi-residence UI switching (schema ready).

---

## 5. Phased delivery

### Phase 0 — Foundation ✅

- [x] Next.js + Tailwind  
- [x] Neon Postgres + Drizzle schema, migrate, seed  
- [x] Auth.js credentials, role middleware  
- [x] Env template  
- [x] Seed: 1 residence, ADMIN + MANAGER + RESIDENT, sample types/rooms/beds  
- [x] Login/logout verified for all three roles; portals open with live DB reads  

### Phase 1 — Inventory CMS ← **current**

- [ ] RoomType CRUD  
- [ ] Bulk provision N rooms of type X  
- [ ] Occupancy board  
- [ ] Shared availability query helpers  

### Phase 2 — Public + Resident booking

- [ ] Public landing + media + live counters  
- [ ] Resident browse/filter  
- [ ] Atomic bed hold + `expiresAt`  
- [ ] Receipt upload + payment reference  
- [ ] My bookings  
- [ ] Cron: expire stale PENDING  

### Phase 3 — Manager workflow

- [ ] Review queue  
- [ ] Approve / Reject + audit log  
- [ ] Dashboard counts (interactive queue; read-only counts already exist)  
- [ ] Race-safe approve/reject  

### Phase 4 — Hardening & launch

- [ ] Zod everywhere; decimal money  
- [ ] Access-control tests  
- [ ] Mobile pass  
- [ ] Neon + Vercel production  
- [ ] Training checklist  
- [ ] Soft launch → December intake  

**Buffer:** ~1 week UAT before last week of November.

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

- Passwords: bcrypt/argon2 via Auth.js  
- Receipts: private bucket; signed URLs for managers  
- Rate-limit register + login  
- Never trust client `amount` — copy from `room_types.pricePerBed` at booking time  
- Cron secret header for expire job  
- Neon PITR backups

---

## 8. Bootstrap order

1. ~~Init Next.js + deps~~ ✅  
2. ~~`drizzle.config.ts` + full schema~~ ✅  
3. ~~Migration + seed~~ ✅  
4. ~~Auth + role middleware~~ ✅  
5. **Admin CMS** → Resident booking → Manager review → Public polish
