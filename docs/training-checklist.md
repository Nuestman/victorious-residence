# Victorious Residence — Staff training checklist

Use this with the Resident Manager and Admin before December intake.

## 1. Accounts & access

- [ ] Sign in as **MANAGER** and confirm `/manager` loads
- [ ] Sign in as **ADMIN** and confirm `/admin` loads
- [ ] Confirm a resident can **register** at `/register` and land in `/resident`
- [ ] Change demo passwords after go-live (seed users are for staging only)

## 2. Inventory (Admin)

- [ ] Create a room type (name, beds-per-room, price per bed)
- [ ] Edit / deactivate a room type
- [ ] Provision rooms (prefix + start number + count) and confirm beds appear
- [ ] Open **Occupancy** and confirm new beds show as Available

## 3. Resident booking path

- [ ] From the public home page, confirm live availability counts
- [ ] As resident: choose a room type → hold a bed
- [ ] Confirm hold expires per `BOOKING_HOLD_HOURS` (default 48h)
- [ ] Upload MoMo/bank **payment reference** + receipt (image/PDF ≤ 1.5MB)
- [ ] Confirm booking appears under **My bookings**

## 4. Manager review path

- [ ] Open `/manager/reviews` (With proof filter)
- [ ] Open a booking, view receipt and reference
- [ ] **Approve** → bed becomes Occupied; resident status SUCCESS
- [ ] Repeat with another booking and **Reject** (reason required) → bed Available again
- [ ] Confirm Occupancy board matches decisions
- [ ] Open **Residents** list, open a resident detail, confirm booking history / allocation

## 5. Ops / staging checks

- [ ] Vercel env set: `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, `BOOKING_HOLD_HOURS`
- [ ] Cron route protected: `/api/cron/expire-bookings` returns 401 without bearer secret
- [ ] Expired holds release beds (wait or temporarily lower hold hours on staging)
- [ ] Mobile: landing, login/register, hold, upload, and manager review usable on phone

## 6. Go-live notes

- Receipts are stored as data URLs in Postgres for now (fine for launch volume; object storage later)
- Only **ADMIN** can change room types / provision rooms
- **MANAGER** and **ADMIN** can review payments
- Residents cannot hold a second bed while one booking is still PENDING
