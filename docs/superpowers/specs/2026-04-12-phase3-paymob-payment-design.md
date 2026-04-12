# Phase 3: Paymob Payment Integration — Design Spec

## Goal

Enable students to pay for bookings via Paymob hosted checkout (card, Vodafone Cash, Fawry). A successful payment transitions the booking from `pending_payment` to `confirmed` via the existing `BookingService.confirmBooking()` path. Includes hold-expiry cron to auto-cancel abandoned bookings and a mock gateway for credential-free local development.

## Architecture

```
Student clicks "Pay" on booking
  → POST /api/bookings/[id]/pay/paymob
  → PaymentGateway.createCheckoutSession()
  → Returns redirect URL to Paymob hosted checkout
  → Student pays on Paymob's page
  → Paymob POSTs webhook to /api/webhooks/paymob
  → HMAC-SHA512 verification on raw body
  → BookingService.confirmBooking(bookingId, metadata)
  → Student redirected to /student/bookings/[id]/return
  → Return page polls GET /api/bookings/[id]/pay-status until confirmed
```

## Components

### 1. PaymobGateway (`lib/services/payments/PaymobGateway.ts`)

Implements the existing `PaymentGateway` interface from `lib/services/payments/PaymentGateway.ts`.

**Responsibilities:**
- Authenticate with Paymob API (POST `/auth/tokens`) to get auth token
- Register order (POST `/ecommerce/orders`) with booking amount in piasters (EGP * 100)
- Create payment key (POST `/acceptance/payment_keys`) with integration ID for the selected method
- Build redirect URL using the payment key and Paymob iframe ID
- Verify HMAC-SHA512 on incoming webhooks
- Parse webhook payload into `ParsedWebhookEvent`

**Piasters conversion** is contained entirely within this class — all external interfaces use EGP.

**Constructor takes:**
- `apiKey: string`
- `integrationIds: { card: string; wallet: string; fawry: string }`
- `iframeId: string`
- `hmacSecret: string`

**Environment variables:**
- `PAYMOB_API_KEY`
- `PAYMOB_INTEGRATION_ID_CARD`
- `PAYMOB_INTEGRATION_ID_WALLET`
- `PAYMOB_INTEGRATION_ID_FAWRY`
- `PAYMOB_IFRAME_ID`
- `PAYMOB_HMAC_SECRET`

### 2. MockPaymentGateway (`lib/services/payments/MockPaymentGateway.ts`)

Used when `PAYMOB_API_KEY` is not set. Enables full flow testing without credentials.

- `createCheckoutSession()` returns redirect URL to `/api/webhooks/paymob/mock-confirm?bookingId=X&returnUrl=Y`
- `verifyWebhook()` always returns `true`
- `parseWebhookEvent()` extracts bookingId from payload

The mock-confirm endpoint calls `BookingService.confirmBooking()` directly and redirects to the return URL.

### 3. Composition root wiring (`lib/composition.ts`)

Update `getPaymentGateway()`:
- If `PAYMOB_API_KEY` is set: instantiate and cache `PaymobGateway`
- Otherwise: instantiate and cache `MockPaymentGateway`
- Log which gateway is active at first call

### 4. API Routes

#### `POST /api/bookings/[id]/pay/paymob` (Student only)

1. Validate booking exists, belongs to student, status is `pending_payment`
2. Read `payment_method` from request body (must be `paymob_card | paymob_wallet | paymob_fawry`)
3. Look up student info for billing details
4. Call `gateway.createCheckoutSession(booking, student, { method, returnUrl })`
5. Store `providerSessionId` on booking via `Booking.updateFields()`
6. Return `{ redirectUrl }` (frontend handles the redirect)

#### `POST /api/webhooks/paymob` (No auth — public endpoint)

1. Read raw body: `const rawBody = await req.text()`
2. Verify HMAC: `gateway.verifyWebhook(rawBody, Object.fromEntries(req.headers))`
3. If invalid, return 401
4. Parse: `const event = gateway.parseWebhookEvent(JSON.parse(rawBody))`
5. If `event.success === false`, log warning, return 200 (booking stays pending, will expire)
6. If `event.success === true`, call `BookingService.confirmBooking(event.bookingId, { payment_id: event.transactionId, transaction_id: event.transactionId })`
7. Always return 200 (Paymob retries on non-200)

**Critical:** Use `req.text()` before `JSON.parse()`. Never use `req.json()` — it consumes the stream and breaks HMAC verification.

#### `GET /api/webhooks/paymob/mock-confirm` (No auth — only exists when mock gateway active)

1. Read `bookingId` and `returnUrl` from query params
2. Call `BookingService.confirmBooking(bookingId)`
3. Redirect (302) to `returnUrl`

The route handler itself checks `process.env.PAYMOB_API_KEY` — if set, returns 404. This prevents accidental invocation in production even if the file is deployed.

#### `GET /api/bookings/[id]/pay-status` (Student only)

1. Validate booking belongs to student
2. Return `{ status, payment_status }` — lightweight, no joins
3. Frontend polls every 3 seconds

#### `POST /api/cron/expire-holds` (CRON_SECRET auth)

1. Verify `Authorization: Bearer ${CRON_SECRET}` header
2. Query: `SELECT id FROM bookings WHERE status = 'pending_payment' AND booked_at < NOW() - INTERVAL 30 MINUTE`
3. For each expired booking: `BookingService.cancelBooking(id, 0, 'admin')` (system user)
4. Return `{ expired: count }`

### 5. Frontend

#### `useCreateCheckoutSession` hook

```typescript
useMutation<{ redirectUrl: string }, Error, { bookingId: number; paymentMethod: PaymentMethod }>
```
POSTs to `/api/bookings/[id]/pay/paymob`, then `window.location.href = redirectUrl`.

#### `useBookingPayStatus` hook

```typescript
useQuery with refetchInterval: 3000, enabled until status !== 'pending_payment'
```
Polls `/api/bookings/[id]/pay-status`.

#### Return page (`app/(dashboard)/student/bookings/[id]/return/page.tsx`)

- Shows "Verifying your payment..." spinner
- Uses `useBookingPayStatus` to poll
- On `confirmed`: shows success message with link to bookings list
- On `cancelled`: shows failure message with retry link
- Stops polling when terminal state reached

### 6. Booking model addition

Add `Booking.findExpiredHolds(conn)` static method:
```sql
SELECT id FROM bookings
WHERE status = 'pending_payment'
  AND booked_at < NOW() - INTERVAL 30 MINUTE
FOR UPDATE
```

## Security

- **HMAC-SHA512** verification on every webhook using raw body bytes
- **Idempotency**: `UNIQUE(transaction_id)` at DB level + `confirmBooking()` no-ops if already confirmed
- **No PCI scope**: hosted checkout — card data never touches our server
- **CRON_SECRET**: hold expiry endpoint protected by bearer token, not role-based auth
- **Webhook endpoint**: returns 200 even on failures to prevent Paymob retry storms; logs errors server-side

## State machine (payment-related transitions)

```
pending_payment → confirmed       (Paymob webhook success)
pending_payment → cancelled       (hold expiry cron after 30 min)
pending_payment → cancelled       (student manual cancel)
pending_review  → confirmed       (admin InstaPay approval — Phase 4)
```

`pending_payment` bookings that receive a failed webhook are NOT transitioned — they stay pending until the hold expires or student retries.

## Files to create/modify

| File | Action |
|------|--------|
| `lib/services/payments/PaymobGateway.ts` | Create |
| `lib/services/payments/MockPaymentGateway.ts` | Create |
| `lib/composition.ts` | Modify (wire gateway) |
| `lib/db/models/Booking.ts` | Modify (add `findExpiredHolds`) |
| `app/api/bookings/[id]/pay/paymob/route.ts` | Create |
| `app/api/bookings/[id]/pay-status/route.ts` | Create |
| `app/api/webhooks/paymob/route.ts` | Create |
| `app/api/webhooks/paymob/mock-confirm/route.ts` | Create |
| `app/api/cron/expire-holds/route.ts` | Create |
| `features/bookings/api/use-bookings.ts` | Modify (add hooks) |
| `app/(dashboard)/student/bookings/[id]/return/page.tsx` | Create |

## Testing

- **Unit tests**: PaymobGateway (HMAC verification, piasters conversion, checkout URL building)
- **Unit tests**: MockPaymentGateway (returns valid mock URLs)
- **Unit tests**: Webhook route (valid HMAC → confirm, invalid HMAC → 401, replay → idempotent, failed payment → no-op)
- **Unit tests**: Hold expiry cron (cancels old holds, skips recent ones)
- **E2E (mock mode)**: Initiate booking → pay → mock-confirm → return page shows confirmed
- **E2E (mock mode)**: Initiate booking → wait 30+ min (or lower threshold for test) → cron expires hold

## Out of scope

- Paymob refunds (not needed for MVP — admin handles manually)
- Payment retry from student side (they can cancel and rebook)
- InstaPay proof upload (Phase 4)
- Zoom meeting creation on confirm (Phase 5)
- Real Paymob sandbox testing (needs merchant account — deferred until credentials available)
