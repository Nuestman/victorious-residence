# Victorious Residence — Post-launch roadmap

Living backlog for work **after** the November launch baseline.  
Current shipped app version: **`0.4.0`** (Phases 0–5 + public site / deposit / balances / audit).  
Schema notes: **ready** = tables/FKs already support it; **partial** = some pieces exist; **new** = needs schema or integrations.

Priorities: **P0** next build · **P1** soon after soft launch · **P2** follow-on product · **P3** scale / polish.

---

## P0 — Campuses & staff (Phase 5) ✅ shipped in `0.4.0`

| Item | Schema | Notes |
| :--- | :--- | :--- |
| Admin multi-residence CRUD | Ready (`residences`) | `/admin/residences` create / edit / deactivate |
| Admin working-campus context | Ready | Cookie switcher on admin inventory pages |
| Assign managers per residence | Ready (`users.residenceId` + `MANAGER`) | Via `/admin/staff` (admin-only `MANAGER` role) |
| Staff directory (admin + manager) | `STAFF` role added | `/admin/staff`, `/manager/staff` |
| Role assignment rules | Enforced in actions | Manager → `STAFF` only; admin → `STAFF` \| `MANAGER`; no UI `ADMIN` |

**Model:** one org admin → many residences; each residence has its own manager(s) and staff scoped by `residenceId`.

### Also shipped with `0.4.0` (beyond original P0)

- Public hospitality site + contact / inquiries + Resend
- Deposit-based bed reservation (≥ GHS 1,000)
- Payment balances + reminder email
- User profile (`/profile`)
- Admin audit log UI (`/admin/audit`)
- App version in portal sidebar footer

---

## P1 — Launch hardening

| Item | Schema | Notes |
| :--- | :--- | :--- |
| Soft-launch UAT | — | Walk `training-checklist.md` with management |
| Production secret hygiene | — | Rotate demo passwords, harden `AUTH_SECRET` / `CRON_SECRET`, lock down seed accounts |
| Rate-limit register / login | New | Follow-on called out in `PLAN.md` §7 |
| Broader automated access-control tests | — | Beyond smoke paths |
| Profile photo / receipt object storage | Partial (`avatar_url`, `receipt_url`) | Blob/S3 cutover when volume grows |

---

## P2 — Product follow-ons (proposal “out of scope”)

| Item | Schema | Notes |
| :--- | :--- | :--- |
| Live MoMo / bank payment APIs | Partial (`payment_status`, gateway-ready fields) | Replace manual proof-of-payment |
| Maintenance / ticketing | New | Resident requests; staff/manager queues |
| Richer public media galleries | Partial (`residence_media`) | Expand unauthenticated showcase |
| Staff self-serve portal | Partial (`STAFF`) | Optional home for non-manager employees (beyond directory CRUD) |

---

## P3 — Scale & ops

| Item | Schema | Notes |
| :--- | :--- | :--- |
| Multi-campus public browse | Ready | Prospect chooses location before room types |
| Cross-residence admin analytics | Ready | Org-wide occupancy / revenue rollups |
| Broader email / SMS notifications | Partial (Resend for inquiries + payment reminders) | Approval / rejection / more ops alerts |
| Deeper audit / export | Partial (`audit_logs` + `/admin/audit`) | CSV exports, retention policy |

---

## Execution

1. ~~Implement **P0** as Phase 5~~ ✅ (`0.4.0`)  
2. Keep **P1** tied to December intake soft launch.  
3. Pull **P2+** into dated phases only when prioritized with the client.

Architecture and completed launch phases remain in [PLAN.md](./PLAN.md).  
Release notes: [CHANGELOG.md](../CHANGELOG.md).
