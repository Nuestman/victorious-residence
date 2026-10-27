# Changelog

All notable changes to Victorious Residence are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once releases are tagged.

## [Unreleased]

### Added

- `docs/` directory with plan, proposal, and invoice docs
- Root `CHANGELOG.md` and `docs/README.md` index

### Fixed

- Vercel/production TypeScript build failures in Auth.js JWT module augmentation
- Lazy database client so builds do not require `DATABASE_URL` at import time
- Dependabot alert: force transitive `esbuild` to `>=0.25.0` via npm `overrides`

### Planned

- Phase 2: public landing polish, resident bed hold, payment proof upload, my bookings, hold expiry job
- Phase 3: manager payment review queue (approve / reject) with audit trail
- Phase 4: hardening, production deploy, training

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

[Unreleased]: https://github.com/Nuestman/victorious-residence/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Nuestman/victorious-residence/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Nuestman/victorious-residence/releases/tag/v0.1.0
