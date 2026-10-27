# Changelog

All notable changes to Victorious Residence are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Soft-launch UAT with Victorious management
- Object-storage receipts when scaling (kept as Postgres data URLs for launch)

## [0.3.0] - 2026-10-27

### Added

- Phase 4 hardening (partial)
  - Resident self-registration (`/register`) with auto sign-in
  - Staff training checklist (`docs/training-checklist.md`)
  - Residents list + detail pages for manager (`/manager/residents`) and admin (`/admin/residents`)
- Phase 3 manager review workflow
  - Overview with occupancy + ready-to-review counts (`/manager`)
  - Review queue with proof / all-pending filters (`/manager/reviews`)
  - Booking detail with receipt view
  - Race-safe Approve (OCCUPIED) / Reject (release bed) + audit logs
- Phase 2 resident booking flow
  - Public home live availability counters
  - Browse room types → choose available bed → atomic hold
  - Payment reference + receipt upload (≤1.5MB image/PDF as DB data URLs)
  - My bookings list and booking detail
  - Hourly cron route `/api/cron/expire-bookings` + `vercel.json`
- `docs/` directory with plan, proposal, invoice, and training docs
- Root `CHANGELOG.md` and `docs/README.md` index

### Changed

- Local/production Node server default port set to `17017` (`npm run dev` / `npm start`)

### Fixed

- Vercel/production TypeScript build failures in Auth.js JWT module augmentation
- Lazy database client so builds do not require `DATABASE_URL` at import time
- Dependabot alert: force transitive `esbuild` to `>=0.25.0` via npm `overrides`

## [0.2.0] - 2026-10-27

### Added

- Admin inventory CMS
  - Room type create / edit / deactivate (`/admin/room-types`)
  - Bulk room provisioning with auto-generated bed spaces (`/admin/provision`)
  - Occupancy board (room → bed status matrix) (`/admin/occupancy`)
- Shared availability and occupancy query helpers
- Admin navigation across CMS pages
- Audit log writes for room-type and provisioning actions

### Changed

- Admin overview uses live availability aggregates
- Resident portal reads availability via shared query helper
- `PLAN.md` progress updated for Phase 0 complete and Phase 1 shipped

## [0.1.0] - 2026-10-26

### Added

- Next.js App Router foundation with TypeScript and Tailwind
- Drizzle schema for residences, users (roles), room types, rooms, bed spaces, bookings, audit logs
- Neon Postgres connection, initial migration, and seed script
- Auth.js credentials login / logout with `RESIDENT`, `MANAGER`, and `ADMIN` roles
- Role-gated routes for `/resident`, `/manager`, and `/admin`
- Portal shells with live read-only inventory counts
- Project proposal, invoice draft, and architecture plan
- Environment template (`.env.example`)

[Unreleased]: https://github.com/Nuestman/victorious-residence/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Nuestman/victorious-residence/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Nuestman/victorious-residence/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Nuestman/victorious-residence/releases/tag/v0.1.0
