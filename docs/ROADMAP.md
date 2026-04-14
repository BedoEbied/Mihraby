# Mihraby MVP Roadmap

> Canonical 7-phase launch plan for the Mihraby tutor booking MVP (Egypt-local).
> This document supersedes the earlier LMS-era phase checklists that used to live
> in `docs/`. The private working copy lives at
> `~/.claude/plans/logical-dreaming-thacker.md` — this file is the committed,
> reviewable version.

## 1. Product context

**Product:** Mihraby is a one-on-one tutor **booking** platform, not an LMS. The
GitHub repo is still named `Tahbeer` for historical reasons; the product name,
copy, and metadata rebrand to **Mihraby** in Phase 0. The word "course" in this
codebase means "a tutor's offering" — bookings (time slot + payment) are the
core domain, not enrollments.

| Attribute | Value |
|---|---|
| Market | Egypt, local customers |
| Currency | **EGP**. Paymob expects **piasters** (1 EGP = 100). |
| Timezone | Store **UTC** in MySQL. Render **Africa/Cairo** on the frontend via `lib/time.ts`. |
| Payments (MVP) | Paymob hosted checkout (card / Vodafone Cash wallet / Fawry) + InstaPay with manual admin review |
| Meetings (MVP) | Zoom OAuth — instructor connects their Zoom, we auto-create meetings on confirmation |
| Deploy target | **Open blocker.** Long-lived VM (DO/Hetzner) recommended so local-disk InstaPay proofs persist. Vercel is viable if Phase 4 swaps to Cloudflare R2. See Decision log. |

**MVP scope — in:**
- Instructor: create courses with slot duration + price, add time slots, connect Zoom
- Student: browse courses, pick available slot, pay via Paymob or InstaPay, receive Zoom link
- Admin: InstaPay approval queue (pending-review list + proof preview + approve/reject)
- Automatic Zoom meeting creation on booking confirmation
- Slot-hold expiry cron for abandoned payments

**MVP scope — out (explicit, see §10):** automated transactional emails, Arabic
/ i18n, full admin dashboard beyond the InstaPay queue, refunds, student-initiated
cancellation of `confirmed` bookings, an 80% coverage target.

---

## 2. Critical invariants

These are locked in by Phase 0 migrations and must survive every later phase.
Do not re-derive them; see `docs/ARCHITECTURE.md` for the full rationale.

1. **Slot locking.** `bookings.slot_hold` is a STORED generated column equal to
   `slot_id` when `status IN ('pending_payment','pending_review','confirmed')`,
   NULL otherwise, with `UNIQUE(slot_hold)`. Concurrent bookings for the same
   slot hit `ER_DUP_ENTRY` (MySQL errno 1062) → mapped to HTTP 409. MySQL allows
   multiple NULLs in a unique index, so cancelled/completed rows don't block new
   bookings. **`bookingService.initiateBooking` ALSO** wraps read-check-insert
   in `withTransaction` + `SELECT ... FOR UPDATE` as belt-and-suspenders.
2. **Webhook idempotency.** `UNIQUE(bookings.transaction_id)` at the DB level
   catches replays. The Paymob webhook handler ALSO `SELECT ... FOR UPDATE`s
   the booking row and no-ops if already `confirmed`. **Read raw body with
   `await req.text()` BEFORE any `JSON.parse`** — `req.json()` consumes the
   stream and breaks HMAC-SHA512 verification.
3. **Shared `confirmBooking()` path.** Paymob webhook and admin InstaPay
   approval BOTH call `BookingService.confirmBooking(bookingId, metadata)`.
   One code path for status transition + Zoom creation. Never duplicate.
4. **InstaPay proof storage.** Uploads go to `./uploads/payment-proofs/`
   (outside `public/`). Served via an admin-gated streaming route. Validate
   mime via **magic bytes**, never `file.type`. Size-check `Content-Length`
   before reading formData.
5. **Zoom rotating refresh tokens.** Zoom refresh tokens are single-use. Refresh
   must run inside `SELECT ... FOR UPDATE` on the `instructor_integrations` row
   to prevent concurrent-refresh token loss. Tokens are AES-256-GCM encrypted
   via `lib/crypto.ts` — never write plaintext tokens.
6. **Zoom failure policy.** Meeting creation runs **after** the booking
   transaction commits. On failure, booking is still `confirmed` (money not
   lost), a row is inserted into `booking_meeting_retries`, and a cron processes
   the queue with exponential backoff. UI shows "meeting link pending".
7. **Course publish guard.** `CourseService` must refuse to transition a course
   to `status='published'` when `meeting_platform='zoom'` and the instructor
   has no integration row. Fails upstream of bookings.
8. **Piasters conversion** is centralized inside `PaymobGateway`. No amount
   math outside that file. Unit-tested (`250 EGP → 25000`).

---

## 3. Phase 0 — Foundations

**Ships:** Nothing user-visible. Unblocks everything else.

### Ships
Rebrand, interface skeletons, DB schema fixes for bookings/slots, connection-aware
models, crypto + time + transaction helpers, type reconciliation.

### Files to create
- `lib/services/payments/PaymentGateway.ts` — interface + `ParsedWebhookEvent` type
- `lib/services/meetings/MeetingProvider.ts` — interface
- `lib/storage/FileStorage.ts` — interface
- `lib/composition.ts` — composition root; singleton instances of gateway,
  meeting provider, storage. Before a concrete impl is wired, accessors throw
  a clear "not wired yet" error so accidental usage fails loud.
- `lib/crypto.ts` — AES-256-GCM encrypt/decrypt using `APP_ENCRYPTION_KEY`
  (32-byte base64). Per-record IV.
- `lib/time.ts` — UTC ↔ Africa/Cairo helpers, single `formatInCairo` export
- `lib/db/transaction.ts` — `withTransaction<T>(fn)` helper + `isDuplicateEntryError`
- `lib/db/models/TimeSlot.ts` — connection-aware (`findById`, `findByCourse`,
  `findAvailableByCourse`, `create`, `update`, `delete`, `lockForBooking`,
  `markHeld`, `release`)
- `lib/db/models/Booking.ts` — connection-aware (`findById`, `findByUser`,
  `findByInstructor`, `findForAdmin`, `create`, `updateStatus`,
  `findPendingOlderThan`)
- `lib/db/models/InstructorIntegration.ts` — CRUD + `getDecryptedTokens` +
  `lockForRefresh`

### Files to modify
- `package.json` (name), `README.md`, `app/layout.tsx` metadata,
  `app/opengraph-image.tsx`, `app/page.tsx`, all `docs/*.md`: Tahbeer → Mihraby
- `types/index.ts`: add `slot_duration`, `price_per_slot`, `meeting_platform`,
  `meeting_link`, `currency` to `ICourse`, `CreateCourseDTO`, `UpdateCourseDTO`.
  Pick as canonical. Delete `lib/types.ts` or reduce to thin re-export. Fix
  any callers that break via `yarn tsc --noEmit`.

### Migrations
- `20260411-fix-bookings-schema.ts`
  - Widen `bookings.status` enum: `pending_payment | pending_review | confirmed | cancelled | completed | no_show`
  - Add `slot_hold` STORED generated column + `UNIQUE(slot_hold)`
  - Add `UNIQUE(transaction_id)` (nullable-safe)
  - Add `payment_proof_path VARCHAR(500) NULL`, `payment_proof_uploaded_at TIMESTAMP NULL`, `admin_notes TEXT NULL`, `instapay_reference VARCHAR(255) NULL`
  - Widen `meeting_platform` enum to include `pending_meeting`
- `20260411-create-instructor-integrations.ts` — table with encrypted token
  columns + `UNIQUE(instructor_id, provider)`
- `20260411-create-booking-meeting-retries.ts` — `booking_id, attempts, last_error, next_retry_at`

### Env vars added
- `APP_ENCRYPTION_KEY` — 32-byte base64, generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Acceptance criteria
- `yarn migrate:up` runs clean on a fresh DB and on a dev DB with existing data
- `yarn tsc --noEmit` passes
- `yarn build` succeeds
- Rollback test: `yarn migrate:down` reverses cleanly

---

## 4. Phase 1 — Time slots CRUD

**Ships:** Instructors manage time slots on their courses. Students see
read-only availability on course pages; Book button stubbed.

### Ships
Slot CRUD end-to-end behind `withAuth([INSTRUCTOR])`, plus a public
`available-only` read endpoint for students.

### Files to create
- `lib/services/timeSlotService.ts` — `createSlot`, `createSlotsBulk`,
  `listByCourse`, `listAvailableByCourse`, `deleteSlot`. Overlap check runs
  inside the same transaction as the insert.
- `app/api/instructor/courses/[id]/slots/route.ts` — GET + POST
- `app/api/instructor/slots/[id]/route.ts` — PUT + DELETE
- `app/api/courses/[id]/slots/available/route.ts` — public GET, filters
  `start_time > now()` AND not already held

### Files to modify
- `lib/validators/time-slot.ts` — already has `createTimeSlotsBulkSchema` from
  Phase 2 foundation work; verify and extend if needed
- `features/time-slots/api/use-time-slots.ts` — verify route paths match

### Acceptance criteria
- Instructor UI lets me create 3 slots on a course
- Public GET returns those 3 slots
- Overlapping slot creation is rejected (409 or validation error)
- Student course page renders availability list (Book button disabled)

---

## 5. Phase 2 — Booking hold & concurrency

**Ships:** Student clicks Book → slot is held → redirected to a "Choose payment
method" page with stub buttons. Playwright proves concurrent booking resolves
to exactly one winner.

### Ships
`bookingService.initiateBooking` + full set of list/get endpoints. Payment is
not wired yet — `confirmBooking` is a stub that flips status.

### Files to create
- `lib/services/bookingService.ts` — **core of the system**
  - `initiateBooking(userId, slotId, paymentMethod)` — transaction,
    `SELECT ... FOR UPDATE` slot, verify availability + future start, insert
    booking with `status='pending_payment'` (card) or `'pending_review'`
    (InstaPay), catch `ER_DUP_ENTRY` → 409
  - `getBookingById(id, requester)` — role-aware auth
  - `listForStudent`, `listForInstructor`, `listForAdmin`
  - `confirmBooking(bookingId, metadata)` — stubbed (status flip only)
  - `cancelBooking(bookingId, by)` — release slot, set `cancelled_at`
  - Per-user concurrent pending-hold cap (anti-abuse, small limit like 3)
- `app/api/bookings/initiate/route.ts` — POST `withAuth([STUDENT])`
- `app/api/bookings/[id]/route.ts` — GET
- `app/api/bookings/[id]/cancel/route.ts` — PUT
- `app/api/student/bookings/route.ts` — GET with `?status=upcoming|past|all`
- `app/api/instructor/bookings/route.ts` — GET
- `app/api/admin/bookings/route.ts` — GET with filters + pagination

### Files to modify
- `lib/validators/booking.ts` — remove `user_id` from `createBookingSchema`
  (derive from auth, never body)
- `features/bookings/api/use-bookings.ts` — verify routes, update DTOs

### Acceptance criteria
- Two `curl` calls to `/api/bookings/initiate` with the same `slot_id`
  simultaneously → exactly one 200 and one 409
- DB shows one booking row, slot flagged held
- Per-user hold cap returns 429 / 4xx on the N+1th pending hold
- Playwright test for concurrent booking is green

---

## 6. Phase 3 — Paymob integration

**Ships:** Student picks "Pay by card" → Paymob hosted checkout → pays →
returned to success page → booking `confirmed` (no Zoom link yet — that's
Phase 5).

### Ships
`PaymobGateway` implementing the `PaymentGateway` interface, the pay-initiate
route, the webhook route with HMAC + idempotency, the return page polling
endpoint.

### Files to create
- `lib/services/payments/PaymobGateway.ts` — implements `PaymentGateway`.
  Methods: `createCheckoutSession(booking, student) → { checkoutUrl }`,
  `verifyWebhook(rawBody, headers) → boolean`,
  `parseWebhookEvent(payload) → ParsedEvent`. **All** piasters conversion
  lives here. Registered as active gateway in `lib/composition.ts`.
- `app/api/bookings/[id]/pay/paymob/route.ts` — POST, creates intention,
  returns `{ checkoutUrl }`
- `app/api/webhooks/paymob/route.ts` — POST, `await req.text()` FIRST,
  HMAC-SHA512 verify, idempotent dispatch to `BookingService.confirmBooking()`,
  401 on bad HMAC, 5xx on our bug
- `app/api/bookings/[id]/pay-status/route.ts` — GET, lightweight status for
  return-page polling
- `app/(student)/booking/[id]/return/page.tsx` — polls status, renders
  Processing / Confirmed / Failed

### Files to modify
- `features/bookings/api/use-bookings.ts` — add `useCreatePaymobIntention`,
  `useBookingStatus`
- `lib/composition.ts` — wire `PaymobGateway` as active gateway

### Env vars added
`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET`,
`PAYMOB_INTEGRATION_ID_FAWRY`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`,
`PAYMOB_RETURN_URL`

### External (parallel, not coding)
Paymob merchant account, integration IDs for card/wallet/Fawry, webhook URL
registered to `/api/webhooks/paymob`. See Risks in §11.

### Acceptance criteria
- Paymob sandbox card flow completes end-to-end
- Replayed signed webhook payload is a no-op second time (200, unchanged status)
- Unit test: `250 EGP → 25000 piasters` (anti-regression for the nastiest bug class)
- `/pay-status` returns `pending` during checkout and `confirmed` after webhook

---

## 7. Phase 4 — InstaPay + admin review

**Ships:** Student selects InstaPay → sees recipient details → uploads
screenshot → booking sits in `pending_review` → admin reviews queue →
approves → shared `confirmBooking` runs (same path as Paymob).

### Ships
`LocalDiskStorage` implementing `FileStorage`, InstaPay submission service,
admin approve/reject endpoints, admin review queue UI.

### Files to create
- `lib/storage/LocalDiskStorage.ts` — implements `FileStorage`. Registered in
  `lib/composition.ts`. R2 swap later = new class, same interface.
- `lib/services/instapayService.ts` — `submitProof(bookingId, userId, file, transactionRef)`
  with ownership + status guard
- `app/api/bookings/[id]/payment-proof/route.ts` — POST `multipart/form-data`,
  validate mime via **magic bytes** (png `89 50 4E 47`, jpeg `FF D8 FF`,
  webp `52 49 46 46 … 57 45 42 50`), max 5 MB, `Content-Length` pre-check
- `app/api/admin/payment-proofs/[bookingId]/route.ts` — GET, admin-gated
  streaming route
- `app/api/admin/bookings/[id]/approve/route.ts` — POST, calls `confirmBooking`
- `app/api/admin/bookings/[id]/reject/route.ts` — POST, requires `reason`,
  calls `cancelBooking`
- `app/(admin)/admin/bookings/pending-review/page.tsx` — table + proof preview
  modal + approve/reject actions

### Files to modify
- `app/api/admin/bookings/route.ts` — add `?status=pending_review` filter
- `features/bookings/api/use-bookings.ts` — add `useUploadPaymentProof`,
  `useAdminApproveBooking`, `useAdminRejectBooking`
- `.gitignore` — add `uploads/`
- `lib/composition.ts` — wire `LocalDiskStorage`

### Env vars added
`UPLOADS_DIR` (default `./uploads`)

### Acceptance criteria
- Upload proof → booking `pending_review`, slot held
- Admin approves → status `confirmed`, shared `confirmBooking` path runs
- Admin rejects → status `cancelled`, slot released
  (`time_slots.is_available=true`)
- Oversized (`>5MB`) upload rejected before reading body
- File with mismatched mime (e.g., `image/png` header but `.pdf` magic bytes)
  rejected

---

## 8. Phase 5 — Zoom OAuth + auto-meeting

**Ships:** Instructor connects Zoom via OAuth (tokens encrypted). Both payment
paths auto-create a Zoom meeting on confirmation.

### Ships
`ZoomProvider` implementing `MeetingProvider`, OAuth connect/callback routes,
instructor settings UI card, publish guard, retry table + cron.

### Files to create
- `lib/services/meetings/ZoomProvider.ts` — implements `MeetingProvider`.
  Methods: `getAuthorizeUrl`, `exchangeCode`, `getAccessToken` (with
  rotating-refresh-token handling inside `SELECT … FOR UPDATE`),
  `createMeetingForBooking(bookingId)`, `deleteMeeting(meetingId, instructorId)`.
  Registered in `lib/composition.ts`.
- `app/api/instructor/integrations/zoom/connect/route.ts` — GET → redirect URL
- `app/api/integrations/zoom/callback/route.ts` — GET → code exchange
- `app/api/instructor/integrations/zoom/route.ts` — GET status, DELETE to disconnect
- `features/integrations/api/use-zoom.ts` — `useZoomStatus`, `useConnectZoom`, `useDisconnectZoom`
- Instructor settings page: Zoom Connect/Disconnect card

### Files to modify
- `lib/services/bookingService.ts#confirmBooking` — after transaction commits,
  call `meetingProvider.createMeetingForBooking(bookingId)`; on failure,
  insert into `booking_meeting_retries` (do NOT block the user)
- `lib/services/courseService.ts` publish path — refuse `published` +
  `meeting_platform='zoom'` when no integration row

### Env vars added
`ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`,
`ZOOM_OAUTH_STATE_SECRET`

### External (parallel, not coding)
Create a Zoom OAuth App (Development mode, private). Scopes: `meeting:write
meeting:read user:read`. Configure redirect URI to staging domain.

### Acceptance criteria
- Connect Zoom as test instructor → integration row exists with encrypted tokens
- Complete full booking flow → `bookings.meeting_link` is populated
- Disconnect Zoom and try to publish a `meeting_platform=zoom` course → blocked
  upstream
- Kill Zoom API mid-flow (force 500) → booking still `confirmed`, row in
  `booking_meeting_retries`, UI shows "meeting link pending"

---

## 9. Phase 6 — Cancellations, crons, polish, staging deploy

**Ships:** Production-ready MVP on staging with smoke suite green.

### Ships
Hold-expiry cron, Paymob reconciliation cron, retry-meetings cron, cancellation
rules, Playwright smoke suite, staging deploy runbook.

### Files to create
- `app/api/cron/expire-holds/route.ts` — POST with `CRON_SECRET` header
  (constant-time compare). Calls `BookingService.expireStalePendingPayments(15)`
  → releases stale holds.
- `app/api/cron/reconcile-paymob/route.ts` — POST with `CRON_SECRET`. Finds
  bookings stuck in `pending_payment` > 30 min and queries Paymob for their
  real status (defense against webhook delivery failures).
- `app/api/cron/retry-meetings/route.ts` — POST with `CRON_SECRET`. Processes
  `booking_meeting_retries` with exponential backoff. Max 5 attempts →
  dead-letter state.
- `app/api/admin/bookings/[id]/retry-meeting/route.ts` — manual re-run button
- `tests/e2e/smoke.spec.ts` — Playwright smoke suite

### Files to modify
- `lib/services/bookingService.ts#cancelBooking` — enforce cancellation rules:
  - Student: can cancel `pending_payment` only (force support for `confirmed`)
  - Instructor: can cancel `confirmed` → release slot + delete Zoom meeting
    (tolerate 404)

### Env vars added
`CRON_SECRET`

### Playwright smoke suite covers
- Full card booking flow (mock Paymob checkout + signed webhook replay)
- InstaPay upload → admin approve → confirmed + Zoom meeting created
- Concurrent booking for same slot → exactly one wins

### Staging deploy
- **Decide deploy target** (see §11 Decision log)
- `.env.staging` with test Paymob creds, dev Zoom app, staging MySQL
- Run all migrations; seed admin, test instructor (with Zoom), one published course
- Manual walkthrough of all 3 flows + smoke suite green

### Acceptance criteria (end-to-end)
1. Fresh staging DB, migrations run
2. Seed: admin, instructor (Zoom connected), published course with 3 slots
3. Student A books slot 1 with card → pays in Paymob sandbox → receives Zoom link
4. Student B books slot 2 with InstaPay → uploads screenshot → admin approves → receives Zoom link
5. Student C tries to book slot 1 → 409 "slot just taken"
6. Student D books slot 3 with card → abandons checkout → 15 min later
   `expire-holds` cron releases slot

---

## 10. Out of scope (explicit)

- **Student-initiated cancellation of `confirmed` bookings** → force support contact
- **Refunds API** — documented in T&Cs as support-only
- **Automated transactional emails** (welcome, confirmation, reminder). The
  cherry-picked `lib/email/` scaffolding is deferred.
- **Arabic / i18n** — flagged. English-only at launch. Adding post-launch is
  ~2-3 days with next-intl. Keep RTL-friendly class choices.
- **Full admin dashboard** beyond the InstaPay queue
- **80% test coverage target** — keep critical-path smoke tests only
- **Search, filters, reviews, categories**
- **Mobile app**
- **Multi-instructor Zoom / Server-to-Server OAuth**
- **GitHub repo rename** from `Tahbeer` → `Mihraby` (manual, breaks clones)
- **International students & teachers (post-MVP expansion)** — MVP is
  Egypt-local only. Going international later will require: multi-currency
  pricing and display (USD, EUR, SAR, AED at minimum), an international
  payment gateway alongside Paymob (Stripe is the natural fit — drops in
  behind the existing `PaymentGateway` interface), per-user timezone
  preferences (replace the hardcoded `Africa/Cairo` render with the student's
  and instructor's own zones), locale-aware datetime rendering, KYC/tax
  handling per jurisdiction, and Arabic + English UI (see i18n item above).
  The interface-first architecture is designed to absorb this — no rewrite
  needed, but it is deliberately out of MVP scope and tracked here so it
  isn't forgotten.

---

## 11. Decision log

| # | Decision | Status | Notes |
|---|---|---|---|
| D1 | Payment gateway for MVP | **Paymob** | Kashier swap path preserved via `PaymentGateway` interface |
| D2 | Meeting provider for MVP | **Zoom OAuth** | Google Meet / Jitsi behind same `MeetingProvider` interface |
| D3 | InstaPay proof storage | **Local disk via `LocalDiskStorage`** | R2 swap = one new class if we go Vercel |
| D4 | Deploy target | **🔴 OPEN BLOCKER** | VM (DO/Hetzner) preferred for local-disk uploads. Vercel is viable only if Phase 4 swaps to R2. **Answer before Phase 4 coding begins.** |
| D5 | Arabic at launch | **Deferred** | Post-launch ~2-3 days with next-intl |
| D6 | Refunds | **Out of scope** | T&Cs direct users to support |
| D7 | Commercial registration for Paymob onboarding | **🟡 OPEN** | Verify with Paymob sales before Phase 3 coding. Fallbacks: Kashier, partner registration, small-business registration (~1 week) |
| D8 | International students/teachers | **Post-MVP** | Egypt-local at launch. International expansion (multi-currency, Stripe alongside Paymob, per-user timezones, i18n, per-jurisdiction KYC/tax) is a later phase. Interface-first architecture absorbs it without a rewrite. See §10 Out of scope. |

---

## 12. Risks & callouts

- **🟡 Paymob onboarding without commercial registration** — verify with Paymob
  sales before Phase 3 coding. Fallbacks above.
- **🟡 Deploy target affects Phase 4 storage** — resolve D4 before Phase 4.
- **🔴 Piasters conversion** — centralize in `PaymobGateway`; amount handling
  outside that file is a bug. Smoke-tested explicitly.
- **🔴 Webhook raw body** — `req.json()` consumes the stream. Must
  `await req.text()` first.
- **🔴 Zoom rotating refresh tokens** — refresh must be inside
  `SELECT … FOR UPDATE`. Concurrent refresh = permanent token loss.
- **🟡 Mime sniffing** — never trust `file.type`. Validate via magic bytes.
- **🟡 Generated-column maintenance gotcha** — STORED generated columns cannot
  be directly modified in `UPDATE` statements. All status transitions go
  through `status` column only; `slot_hold` follows automatically.
- **🟡 NULL-duplicates-allowed** — MySQL `UNIQUE` allows multiple NULLs. That's
  exactly what we want (cancelled/completed rows don't block new bookings).
  Do NOT "fix" this.
- **🟢 Test coverage** — cut from 80% target. The 3 smoke tests are
  non-negotiable.

---

## Appendix A — Legacy checklists (folded from deleted docs)

The deleted `docs/PHASE2_CHECKLIST.md` contained DX hardening items that are
folded into Phase 6 polish:
- Structured JSON logging with request IDs
- Error response shape audit
- Husky pre-commit for `yarn lint` + `yarn tsc --noEmit`

The deleted `docs/PHASE3_CHECKLIST.md` contained post-MVP wishlist items now
tracked in §10 Out of scope: reviews, search, categories, instructor analytics,
student wishlists.

---

> **Origin note:** This document is the canonical, committed version of the
> private plan at `~/.claude/plans/logical-dreaming-thacker.md`. If that file
> drifts from this one, this file wins.
