# Mihraby — Tutor Booking Platform

A one-on-one tutor booking platform for Egypt. Instructors publish courses with
time slots; students book and pay per session (Paymob card/wallet/Fawry or
InstaPay with manual review); meetings are auto-created on Zoom.

> The GitHub repo is still named **Tahbeer** for historical reasons. The
> product is **Mihraby**. The codebase is a **single Next.js 16 App Router
> monolith** — there is no separate Express backend.

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript 5** everywhere
- **MySQL 8** via `mysql2/promise` at runtime, **Knex** for migrations only
- **Zustand** + **TanStack Query v5** for client state
- **Tailwind CSS 4**
- **Zod** for input validation, **bcryptjs** + **jsonwebtoken** for auth
- **Vitest 2** (unit/integration, jsdom, MSW) + **Playwright** (E2E)

## Quick start

### Prerequisites

- Node.js 20+ and Yarn
- MySQL 8.0+ running locally (or reachable)

### Setup

```bash
# 1. Install
yarn install

# 2. Create .env from .env.example and fill in:
#    DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET
cp .env.example .env

# 3. Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mihraby;"

# 4. Run migrations (Knex CLI)
npx knex --knexfile knexfile.ts migrate:latest

# 5. Seed dev data
yarn db:seed

# 6. Start the dev server
yarn dev
```

The app runs on `http://localhost:3000`. There is no separate API port —
routes live under `app/api/**` in the same Next.js process.

**Phase-specific env vars** (added as features land — see `docs/ROADMAP.md`):
`APP_ENCRYPTION_KEY` (Phase 0, 32-byte base64 for AES-256-GCM token
encryption), `PAYMOB_*` (Phase 3), `UPLOADS_DIR` (Phase 4), `ZOOM_*`
(Phase 5), `CRON_SECRET` (Phase 6).

Generate `APP_ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Commands

```bash
# Dev server (Next.js 16 + Turbopack)
yarn dev

# Production build + start
yarn build
yarn start

# Lint (ESLint 9 flat config)
yarn lint

# Typecheck (no yarn script; run directly)
npx tsc --noEmit

# Unit + integration tests (Vitest)
yarn test                       # run once
yarn test:ui                    # watch UI
npx vitest run path/to.test.ts  # single file
npx vitest run -t "pattern"     # single test by name

# End-to-end tests (Playwright)
yarn test:e2e

# Database migrations (Knex)
npx knex --knexfile knexfile.ts migrate:latest
npx knex --knexfile knexfile.ts migrate:rollback
npx knex --knexfile knexfile.ts migrate:make <name> -x ts

# Seed
yarn db:seed
```

## Docs

- **[`docs/ROADMAP.md`](docs/ROADMAP.md)** — canonical 7-phase MVP plan
  (Phase 0 foundations through Phase 6 staging deploy). Start here if you
  want to know what we're building next.
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — layered structure,
  composition root, slot-locking, webhook idempotency, encrypted tokens,
  testing layers. Start here if you want to understand the code.
- **[`docs/TECHNICAL_REQUIREMENTS.md`](docs/TECHNICAL_REQUIREMENTS.md)** —
  long-form background requirements (epics, user stories). Useful context,
  but `ROADMAP.md` is the source of truth for scope.
- **[`docs/PHASE2_FOUNDATION.md`](docs/PHASE2_FOUNDATION.md)** — historical
  notes on the Phase 2 foundation work (time slots/bookings schema, types,
  validators) that shipped on `develop`. Phase 0 of `ROADMAP.md` builds on it.
- **[`CLAUDE.md`](CLAUDE.md)** — day-to-day working conventions for AI
  assistants (and humans) contributing to this repo.

## User roles

| Role | What they do |
|---|---|
| **Student** | Browse courses, pick an available time slot, pay, join Zoom meeting |
| **Instructor** | Create courses, manage time slots, connect Zoom, view/cancel bookings |
| **Admin** | Review InstaPay proofs, approve/reject pending bookings |

## Payments

- **Paymob** hosted checkout — card, Vodafone Cash wallet, Fawry. Amounts
  are stored in EGP; conversion to piasters (1 EGP = 100) is centralized in
  `PaymobGateway`.
- **InstaPay manual** — student uploads a payment screenshot, booking sits
  in `pending_review` until an admin approves it. Both payment paths converge
  on the same `BookingService.confirmBooking` code path.

See `docs/ARCHITECTURE.md` §5 for webhook idempotency rules and
`docs/ROADMAP.md` §6–7 for the full payment + admin review flow.

## Meetings

- **Zoom OAuth** — each instructor connects their own Zoom account. Tokens
  are AES-256-GCM encrypted at-rest; refresh tokens are rotating and must be
  refreshed inside a `SELECT ... FOR UPDATE` transaction. On meeting
  creation failure, the booking is still `confirmed` and a retry cron
  processes the `booking_meeting_retries` table.

## License

ISC. Private project — not currently accepting external contributions.
