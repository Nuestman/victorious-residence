# Victorious Residence — Staff training checklist

Use this with the Resident Manager and Admin before December intake.  
App version: **`0.4.0`** (see portal sidebar footer).

## 1. Accounts & access

- [ ] Sign in as **MANAGER** and confirm `/manager` loads
- [ ] Sign in as **ADMIN** and confirm `/admin` loads
- [ ] Sign in as **STAFF** (if seeded) and confirm role-appropriate access
- [ ] Confirm a resident can **register** at `/register` and land in `/resident`
- [ ] Open **Profile** (`/profile`): update IDs, hometown, emergency contact, avatar, password
- [ ] Change demo passwords after go-live (seed users are for staging only)

## 2. Inventory & campuses (Admin)

- [ ] Open **Residences** (`/admin/residences`): create / edit / deactivate a campus
- [ ] Switch **working campus** and confirm inventory pages follow the selection
- [ ] Create a room type (name, beds-per-room, price per bed)
- [ ] Edit / deactivate a room type
- [ ] Provision rooms (prefix + start number + count) and confirm beds appear
- [ ] Open **Occupancy** and confirm new beds show as Available
- [ ] Open **Staff** (`/admin/staff`): create STAFF / MANAGER; confirm only admin can assign MANAGER

## 3. Public site & contact

- [ ] Walk public pages: `/`, `/rooms`, `/facilities`, `/gallery`, `/about`, `/contact`
- [ ] Submit a contact inquiry; confirm it appears under **Inquiries** and email is sent (if Resend configured)

## 4. Resident booking path

- [ ] From the public home / rooms page, confirm live availability counts
- [ ] As resident: choose a room type → **Apply** for a bed (does not lock inventory yet)
- [ ] Pay a **non-refundable deposit of at least GHS 1,000**, upload reference + receipt
- [ ] Confirm the bed becomes **PENDING_PAYMENT** (reserved) after deposit proof
- [ ] Confirm booking appears under **My bookings**

## 5. Manager review & balances

- [ ] Open `/manager/reviews` (With deposit proof filter)
- [ ] Open a booking, view claimed deposit amount, receipt, and reference
- [ ] **Approve** → bed becomes Occupied; resident status SUCCESS
- [ ] Repeat with another booking and **Reject** (reason required) → bed Available again
- [ ] Confirm Occupancy board matches decisions
- [ ] Open **Residents** list, open a resident detail, confirm booking history / allocation
- [ ] Open **Balances** (`/manager/balances`): full / paid / remaining; send a payment reminder email
- [ ] Open **Staff** (`/manager/staff`): create/edit STAFF only (cannot assign MANAGER)

## 6. Admin ops

- [ ] Open **Balances** (`/admin/balances`) for campus-scoped payment tracking
- [ ] Open **Audit** (`/admin/audit`): search login, campus switch, booking, and inventory actions

## 7. Ops / staging checks

- [ ] Vercel env set: `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`
- [ ] Optional: `RESEND_API_KEY`, `EMAIL_FROM`, contact recipient vars for mail
- [ ] Optional: `BOOKING_APPLICATION_ABANDON_DAYS` (default 14) for unpaid applications
- [ ] Cron route protected: `/api/cron/expire-bookings` returns 401 without bearer secret
- [ ] Unpaid applications (no deposit) close after abandon window without locking beds
- [ ] Mobile: public site, login/register, apply, deposit upload, and manager review usable on phone

## 8. Go-live notes

- Receipts / avatars are stored as data URLs in Postgres for now (fine for launch volume; object storage later)
- Only **ADMIN** can change room types / provision rooms / manage residences / view full audit
- **MANAGER** and **ADMIN** can review payments and view balances
- Beds are reserved only after a ≥ GHS 1,000 deposit proof is submitted (non-refundable)
- Residents cannot start a second booking while one is still PENDING
- System version is shown in the portal sidebar footer (`package.json`)
