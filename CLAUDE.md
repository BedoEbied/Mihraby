# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product identity

The GitHub repo is named **Tahbeer** for historical reasons, but the product is **Mihraby** — a one-on-one tutor booking platform targeting Egypt local customers. The word "course" in this codebase means "a tutor's offering", not an LMS course. Bookings (time slots + payment) are the core domain, not enrollments.

- Currency: **EGP** (Egyptian Pound). Paymob amounts are in piasters (1 EGP = 100).
- Timezone: store **UTC** in MySQL (`DATETIME` is TZ-naive — we own correctness); render **Africa/Cairo** on the frontend via `lib/time.ts#formatInCairo`.
- Payments (MVP): Paymob hosted checkout (card / Vodafone Cash wallet / Fawry) + InstaPay with manual admin review (student uploads screenshot, booking sits in `pending_review` until admin approves).
- Meetings (MVP): Zoom OAuth — instructor connects their Zoom, we auto-create meetings on booking confirmation.

## Commands

```bash
# Dev server (Next.js 16 + Turbopack by default)
yarn dev

# Production build + start
yarn build
yarn start

# Lint (ESLint 9 flat config in eslint.config.mjs)
yarn lint

# Unit + integration tests (Vitest 2, jsdom env, MSW available)
yarn test                       # run once
yarn test:ui                    # vitest watch UI
npx vitest run path/to.test.ts  # single test file
npx vitest run -t "pattern"     # single test by name

# End-to-end tests (Playwright — excluded from tsc via tsconfig)
yarn test:e2e

# Typecheck (no yarn script defined — run directly)
npx tsc --noEmit

# Database migrations (Knex; no yarn scripts wired yet, use knex CLI directly)
npx knex --knexfile knexfile.ts migrate:latest
npx knex --knexfile knexfile.ts migrate:rollback
npx knex --knexfile knexfile.ts migrate:make <name> -x ts
# Template for new migrations: migrations/template.ts

# Seed (custom script, requires dotenv + ts-node)
yarn db:seed
```

**Env vars required for local dev:** `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`. Add once Phase 0+ features come online: `APP_ENCRYPTION_KEY` (32-byte base64 for AES-256-GCM token encryption — generate via `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), `PAYMOB_*`, `ZOOM_*`, `UPLOADS_DIR`, `CRON_SECRET`.

## Architecture

Single **Next.js 16 App Router** monolith with `mysql2` + Knex (Knex is only used for migrations; runtime queries use the raw `mysql2/promise` pool). Authentication via JWT stored in HTTP-only cookie (`auth_token`) with a Bearer-header fallback. Authorization via role enum (`UserRole.ADMIN | INSTRUCTOR | STUDENT`) + a policy registry (`lib/authorization/policies.ts`).

### Layered structure (upstream → downstream)

```
app/api/**/route.ts     — thin HTTP handlers; parse with Zod, call service, return ApiResponse
  │
lib/middleware/auth.ts  — withAuth([roles], handler) wraps every protected route
  │
lib/services/*.ts       — business logic, authorization, orchestration
  │
lib/db/models/*.ts      — data access; connection-aware (accept optional PoolConnection)
  │
lib/db/connection.ts    — single mysql2 pool; use withTransaction() for multi-statement work
```

**Route handlers must stay thin.** The pattern is: Zod parse → service call → `ApiResponse<T>`. Business logic, authorization checks, and DB access live in services. Models are stateless classes of static methods.

### Feature modules (frontend)

`features/<domain>/{api,components}` — each domain (auth, courses, bookings, time-slots) has its own React Query hooks in `api/use-*.ts` and UI components in `components/`. Pages and routes never call `fetch` directly; they go through hooks. `lib/api/client.ts` is the shared fetch wrapper that injects the auth token and handles errors.

### Interface-first external dependencies (SOLID, non-negotiable)

Payment gateways, meeting providers, and file storage are each behind a TypeScript interface. Concrete implementations live next to their interfaces. The **only** file allowed to import concrete implementations is `lib/composition.ts` (the composition root):

- `lib/services/payments/PaymentGateway.ts` — interface; active impl will be `PaymobGateway` (Phase 3). Swapping to Kashier later is one new class + one line in `composition.ts`.
- `lib/services/meetings/MeetingProvider.ts` — interface; active impl will be `ZoomProvider` (Phase 5).
- `lib/storage/FileStorage.ts` — interface; active impl will be `LocalDiskStorage` (Phase 4). R2/S3 swap is one new class.

Everywhere else uses `getPaymentGateway()` / `getMeetingProvider()` / `getFileStorage()` from `lib/composition.ts`. Before a concrete impl is wired, these throw a clear "not wired yet" error so accidental usage fails loud.

### Shared types

`types/index.ts` is **canonical** for both backend and frontend types. `lib/types.ts` re-exports from it plus frontend-only types (`AuthContextType`). Never create a parallel type definition in `lib/types.ts` — edit `types/index.ts` instead. The booking state machine is:

```
pending_payment → confirmed          (Paymob webhook)
pending_review  → confirmed          (admin InstaPay approval)
pending_payment → cancelled          (hold expiry cron, student cancel)
pending_review  → cancelled          (admin InstaPay rejection)
confirmed       → completed          (post-session)
confirmed       → no_show            (post-session, instructor marks)
confirmed       → cancelled          (instructor cancellation)
```

## Critical design invariants

These are locked in by Phase 0 migrations and must be preserved. Don't re-derive them.

1. **Slot locking (double-booking prevention)** — `bookings.slot_hold` is a STORED generated column equal to `slot_id` when `status IN ('pending_payment','pending_review','confirmed')`, NULL otherwise, with a `UNIQUE(slot_hold)` index. Concurrent bookings for the same slot hit `ER_DUP_ENTRY` (MySQL errno 1062) — mapped to HTTP 409 via `isDuplicateEntryError()` in `lib/db/transaction.ts`. `bookingService.initiateBooking` ALSO wraps read-check-insert in `withTransaction` + `SELECT ... FOR UPDATE` on the time slot as belt-and-suspenders.

2. **Webhook idempotency** — `UNIQUE(bookings.transaction_id)` at the DB level catches replays. The Paymob webhook handler ALSO locks the booking with `SELECT ... FOR UPDATE` and no-ops if already `confirmed`. **Read raw body with `await req.text()` BEFORE any `JSON.parse`** — `req.json()` consumes the stream and breaks HMAC-SHA512 verification. Paymob amounts are in piasters; conversion lives inside `PaymobGateway` and must never leak out.

3. **Shared `confirmBooking()` path** — Both the Paymob webhook AND the admin InstaPay approval endpoint call the same `BookingService.confirmBooking(bookingId, metadata)`. One code path for status transition + Zoom meeting creation. Never duplicate this logic.

4. **InstaPay proof storage** — Uploaded screenshots go to `./uploads/payment-proofs/` (outside `public/` — privacy). Served via an admin-gated `/api/admin/payment-proofs/[bookingId]` route that streams the file. Validate mime via **magic bytes**, never `file.type`. Size-check `Content-Length` before reading formData to avoid OOM on hostile uploads.

5. **Zoom rotating refresh tokens** — Zoom's refresh tokens are single-use. Refresh must run inside `SELECT ... FOR UPDATE` on the `instructor_integrations` row (see `InstructorIntegration.lockForRefresh()`) to prevent concurrent-refresh token loss. OAuth tokens are stored AES-256-GCM encrypted via `lib/crypto.ts` — never write plaintext tokens to the table.

6. **Zoom failure policy** — Zoom meeting creation runs AFTER the booking-status transaction commits. On failure, the booking is still `confirmed` (money is not lost), a row is inserted into `booking_meeting_retries`, and a cron processes the queue with exponential backoff. UI shows "meeting link pending" rather than an error.

7. **Course publish guard** — `CourseService` must refuse to transition a course to `status='published'` when `meeting_platform='zoom'` and the instructor has no integration row. Fails upstream of bookings so students never hit mid-booking Zoom failures.

## Transactions

Every service method that touches both `bookings` and `time_slots` (or any multi-row state change) MUST use `withTransaction` from `lib/db/transaction.ts`. Models are connection-aware — pass the `PoolConnection` down so nested calls participate in the same transaction instead of silently running on separate pool connections.

```ts
await withTransaction(async (conn) => {
  const slot = await TimeSlot.lockForBooking(conn, slotId);
  if (!slot?.is_available) throw new Error('Slot taken');
  const booking = await Booking.create(conn, {...});
  await TimeSlot.markHeld(conn, slotId, userId);
  return booking;
});
```

## Testing

- `tests/unit/**` — Vitest + jsdom, uses `@testing-library/react` and MSW for HTTP mocks. Vitest is configured via `vitest.config.ts` (see repo root).
- `tests/e2e/**` — Playwright. Excluded from `tsc` via `tsconfig.json` — has its own type environment.
- Critical path tests (must exist before MVP ship): full Paymob card booking (mocked), InstaPay upload→approve→confirmed, concurrent booking for the same slot lands exactly one winner.

## MVP launch plan

An approved 7-phase MVP launch plan lives at `~/.claude/plans/logical-dreaming-thacker.md`. Phase 0 (foundation) is complete; Phases 1–6 (time slots, booking hold, Paymob, InstaPay, Zoom, cancellations+deploy) are pending. Read the plan file before starting on any phase — it captures decisions that can't be re-derived from code alone.

## Known pre-existing issues

- `tests/unit/authMiddleware.test.ts` has 3 TypeScript errors (mock `Request` not assignable to `NextRequest`). Pre-existing; not in scope to fix unless you're touching auth middleware.
- `package.json` has no `migrate:up`/`migrate:down` scripts yet — use the `npx knex` commands above.
- `features/bookings/components/index.ts` and `features/time-slots/components/index.ts` are empty barrels; real components land in Phases 1/2/4.
