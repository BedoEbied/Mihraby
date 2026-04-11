# Mihraby Architecture

> How the code is organized, why it's organized that way, and the invariants
> you must not break. Pair this with `docs/ROADMAP.md` for the phased delivery
> plan and `CLAUDE.md` for day-to-day working conventions.

## 1. Layered structure

Mihraby is a **single Next.js 16 App Router monolith** (no separate backend).
Runtime queries use the `mysql2/promise` pool; Knex is only used for
migrations. The layering is strict upstream → downstream:

```
app/api/**/route.ts     — thin HTTP handlers: Zod parse → service call → ApiResponse<T>
  │
lib/middleware/auth.ts  — withAuth([roles], handler) wraps every protected route
  │
lib/services/*.ts       — business logic, authorization, orchestration
  │
lib/db/models/*.ts      — data access; connection-aware (accept optional PoolConnection)
  │
lib/db/connection.ts    — single mysql2 pool; use withTransaction() for multi-statement work
```

**Route handlers must stay thin.** No business logic, no DB calls, no
authorization beyond what `withAuth` gives you. The pattern is always:

```ts
export const POST = withAuth([UserRole.STUDENT], async (req, { user }) => {
  const body = createBookingSchema.parse(await req.json());
  const booking = await bookingService.initiateBooking(user.id, body);
  return apiResponse.success(booking);
});
```

Business logic, authorization policies, and DB access live in services. Models
are stateless classes of static methods.

---

## 2. Feature modules (frontend)

```
features/
  <domain>/
    api/use-*.ts        — React Query hooks; the ONLY place fetch() is called
    components/         — domain components (SlotPicker, BookingCard, ...)
```

Each domain (auth, courses, bookings, time-slots) owns its hooks and
components. **Pages and routes never call `fetch` directly** — they go through
hooks. `lib/api/client.ts` is the shared fetch wrapper that injects the auth
token and normalizes errors.

Cross-domain reusable primitives (EmptyState, ConfirmDialog, FileUploader,
PageHeader) live in `components/`, not inside a feature folder.

---

## 3. Composition root & interface-first external dependencies

External dependencies are behind TypeScript interfaces. Concrete implementations
live next to their interfaces. **`lib/composition.ts` is the only file allowed
to import concrete implementations.**

```
lib/services/payments/
  PaymentGateway.ts        — interface + ParsedWebhookEvent type
  PaymobGateway.ts         — Phase 3 concrete impl
lib/services/meetings/
  MeetingProvider.ts       — interface
  ZoomProvider.ts          — Phase 5 concrete impl
lib/storage/
  FileStorage.ts           — interface
  LocalDiskStorage.ts      — Phase 4 concrete impl
lib/composition.ts         — getPaymentGateway() / getMeetingProvider() / getFileStorage()
```

Everywhere else (services, routes) imports only the interfaces and calls the
accessors from `lib/composition.ts`. Before a concrete impl is wired, the
accessor throws a clear "not wired yet" error — accidental usage fails loud.

**Why:** Swapping Paymob → Kashier, Zoom → Google Meet, or local disk → R2
is one new class + one line in `composition.ts`. Not a rewrite.

---

## 4. Slot-locking mechanism

This is the most important invariant in the system. There are **two**
independent mechanisms, and both must stay in place.

### Mechanism 1: DB-level unique index on a generated column

```sql
ALTER TABLE bookings
  ADD COLUMN slot_hold BIGINT AS (
    CASE WHEN status IN ('pending_payment','pending_review','confirmed')
         THEN slot_id
         ELSE NULL
    END
  ) STORED,
  ADD UNIQUE KEY uk_slot_hold (slot_hold);
```

- When a booking is in a "holding" state, `slot_hold = slot_id`.
- When cancelled / completed / no-show, `slot_hold` becomes NULL.
- MySQL `UNIQUE` allows multiple NULLs, so old cancelled rows don't block
  new bookings. **This is the desired behavior — do not "fix" it.**
- Concurrent `INSERT`s for the same `slot_id` hit `ER_DUP_ENTRY` (MySQL
  errno 1062). `isDuplicateEntryError()` in `lib/db/transaction.ts` detects
  it and routes become HTTP 409.

### Mechanism 2: Transactional `SELECT ... FOR UPDATE`

```ts
await withTransaction(async (conn) => {
  const slot = await TimeSlot.lockForBooking(conn, slotId);
  if (!slot?.is_available) throw new ConflictError('Slot taken');
  const booking = await Booking.create(conn, { ... });
  await TimeSlot.markHeld(conn, slotId, userId);
  return booking;
});
```

**Why both?** Mechanism 2 gives readable errors and clean state-machine
transitions. Mechanism 1 is the belt-and-suspenders backstop against races
the application layer misses (including misbehaving crons, direct SQL, or
future bugs). **Neither alone is enough.**

### Maintenance gotcha

STORED generated columns cannot be modified directly by `UPDATE`. All status
transitions go through the `status` column only; `slot_hold` follows
automatically. Do not add triggers or application-level writes against
`slot_hold`.

---

## 5. Webhook idempotency

Paymob webhooks may fire more than once (retries, network hiccups). The Phase 3
handler must:

1. **Read raw body FIRST.** `await req.text()` before `JSON.parse`. The
   `req.json()` helper consumes the stream and breaks HMAC-SHA512 verification.
   This is the single most common bug class in Next.js webhook handlers.
2. **HMAC-SHA512 verify** the raw body against `PAYMOB_HMAC_SECRET`. Bad
   signature → 401.
3. **Parse the event** through `PaymobGateway.parseWebhookEvent`.
4. **Lock the booking row** with `SELECT ... FOR UPDATE` inside a transaction.
5. **Idempotent dispatch:** if `status === 'confirmed'` already, no-op and
   return 200.
6. **Otherwise:** call the shared `BookingService.confirmBooking(bookingId, metadata)`.

At the DB level, `UNIQUE(bookings.transaction_id)` catches any replay that
slips through the application logic.

### Shared confirm path

Both the Paymob webhook and the admin InstaPay approval endpoint call
`BookingService.confirmBooking(bookingId, metadata)`. **One code path** for
status transition + Zoom creation. Never duplicate.

---

## 6. Transaction helper

`lib/db/transaction.ts` exports `withTransaction<T>(fn)`:

```ts
export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
```

**Models are connection-aware.** Every model static method that mutates state
accepts an optional `PoolConnection` as its first argument. When a service
orchestrates multi-model work in a transaction, it passes the same `conn`
down so all operations participate in one transaction:

```ts
// WRONG: runs on separate pool connections, no transactionality
await Booking.create({...});
await TimeSlot.markHeld(slotId);

// RIGHT
await withTransaction(async (conn) => {
  await Booking.create(conn, {...});
  await TimeSlot.markHeld(conn, slotId);
});
```

`isDuplicateEntryError(err)` detects MySQL errno 1062 and is used by services
to translate slot-locking failures into 409s.

---

## 7. Encrypted OAuth tokens

Zoom OAuth tokens live in `instructor_integrations`. They are encrypted
at-rest with **AES-256-GCM** via `lib/crypto.ts`.

- Key: `APP_ENCRYPTION_KEY`, 32-byte base64 env var
- **IV per record** (not reused)
- Ciphertext layout: `base64(iv) . ':' . base64(ciphertext) . ':' . base64(authTag)`
- `InstructorIntegration.getDecryptedTokens(conn, instructorId)` is the only
  sanctioned read path

### Rotating refresh tokens (Zoom-specific)

Zoom refresh tokens are **single-use**. If two concurrent requests both try
to refresh, one wins and the other's refresh token is permanently invalidated.
The fix:

```ts
await withTransaction(async (conn) => {
  const integration = await InstructorIntegration.lockForRefresh(conn, instructorId);
  if (tokenStillValid(integration)) return integration;  // double-check
  const fresh = await zoom.refreshTokens(integration.refresh_token);
  await InstructorIntegration.updateTokens(conn, instructorId, fresh);
  return fresh;
});
```

`lockForRefresh` runs `SELECT ... FROM instructor_integrations ... FOR UPDATE`.
Every concurrent refresh queues behind the first one and reads the fresh
tokens instead of re-refreshing.

---

## 8. Timezone handling

- **Storage:** MySQL `DATETIME` is TZ-naive. We store **UTC** and treat the
  DB as UTC. Do not use `TIMESTAMP` columns (TZ-dependent on `@@session.time_zone`).
- **Rendering:** `lib/time.ts#formatInCairo(date)` is the single sanctioned
  path for displaying a time to a user. It formats in `Africa/Cairo`.
- **Input:** Validators (`lib/validators/time-slot.ts`) require ISO 8601 strings
  with offsets. The service layer normalizes to UTC before insertion.
- **Cron / business logic:** always compute in UTC. Business rules like
  "slots must be at least 1 hour in the future" compare against `new Date()`
  (which is a UTC instant, regardless of the server's local zone).
- **International expansion (post-MVP):** the Cairo render is hardcoded on
  purpose for MVP. When international students/teachers ship (see
  `ROADMAP.md` §10 + decision D8), replace the hardcoded `Africa/Cairo`
  argument with a per-user preference (`users.timezone`) and surface both
  zones on the booking card ("10:00 Cairo / 09:00 your time"). The storage
  side (UTC everywhere) does not change.

---

## 9. Authorization

Authentication is JWT in an HTTP-only cookie (`auth_token`) with a Bearer-header
fallback. Authorization is role-based via the `UserRole` enum (`ADMIN`,
`INSTRUCTOR`, `STUDENT`) plus a **policy registry** in
`lib/authorization/policies.ts`.

- `withAuth([roles], handler)` wraps every protected route. Fails 401/403
  before the handler runs.
- Policy registry holds predicates like `canViewBooking(user, booking)` and
  `canApproveInstaPay(user, booking)`. Services call policies before mutating
  state. Routes never re-implement policy logic.
- Booking state machine:

```
pending_payment → confirmed          (Paymob webhook)
pending_review  → confirmed          (admin InstaPay approval)
pending_payment → cancelled          (hold expiry cron, student cancel)
pending_review  → cancelled          (admin InstaPay rejection)
confirmed       → completed          (post-session)
confirmed       → no_show            (post-session, instructor marks)
confirmed       → cancelled          (instructor cancellation)
```

Transitions are enforced in `BookingService`, not in routes. There is no
student path from `confirmed` → `cancelled` in MVP (force support contact).

---

## 10. Testing layers

| Layer | Tool | Scope | Location |
|---|---|---|---|
| Unit | Vitest 2 + jsdom | Pure functions, services with mocked models, React components with MSW | `tests/unit/**` |
| Component | `@testing-library/react` | Components in isolation | `tests/unit/**/*.test.tsx` |
| HTTP mock | MSW | Network calls from hooks | shared handlers per feature |
| E2E | Playwright | Critical booking flows | `tests/e2e/**` (excluded from `tsc` via `tsconfig.json`) |

**Non-negotiable critical-path tests** (land before MVP ships, see Phase 6):
1. Full Paymob card booking flow (mocked checkout + signed webhook replay)
2. InstaPay upload → admin approve → confirmed + Zoom meeting creation
3. Concurrent booking for the same slot → exactly one 200, one 409
4. Piasters conversion unit test (`250 EGP → 25000`)

Other tests are welcome but not required for launch. The 80% coverage target
was explicitly cut.

---

## 11. Configuration & environment

| Category | Env vars |
|---|---|
| Local dev (minimum) | `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET` |
| Phase 0 adds | `APP_ENCRYPTION_KEY` (32-byte base64) |
| Phase 3 adds (Paymob) | `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET`, `PAYMOB_INTEGRATION_ID_FAWRY`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`, `PAYMOB_RETURN_URL` |
| Phase 4 adds (InstaPay) | `UPLOADS_DIR` (default `./uploads`) |
| Phase 5 adds (Zoom) | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`, `ZOOM_OAUTH_STATE_SECRET` |
| Phase 6 adds (crons) | `CRON_SECRET` |

Generate `APP_ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 12. Reading order for new contributors

1. This file (`docs/ARCHITECTURE.md`)
2. `docs/ROADMAP.md` — what we're building and why
3. `CLAUDE.md` — day-to-day working conventions
4. `docs/TECHNICAL_REQUIREMENTS.md` — long-form requirements (background material)
5. Start at `app/api/bookings/initiate/route.ts` (once Phase 2 lands) to trace
   a request top-to-bottom through the layers

---

> **Origin note:** This document is derived from `CLAUDE.md` and the canonical
> plan at `~/.claude/plans/logical-dreaming-thacker.md`. When conventions
> evolve, update this file in the same PR as the code change.
