# Mihraby — US Launch Runbook

This is the go-live checklist for the US + PayPal launch on Railway. It
assumes the PayPal-aware code on `claude/paypal-us-students-launch-fFn1U`
has been merged into `main` and CI is green.

---

## 1. Pre-flight

- [ ] Railway project exists and is on a paid plan (for predictable cold-starts).
- [ ] MySQL plugin is attached to the service and has a public variable group
      exposing `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`,
      `MYSQL_PORT`.
- [ ] PayPal Business account exists and is fully verified (bank link, email
      confirmed, ID check). Sandbox → live is blocked until verification is
      complete.
- [ ] Main branch is green on GitHub Actions (`lint-typecheck-unit` + `e2e`).

---

## 2. Railway environment variables

Set these on the Mihraby service in the Railway dashboard. Values in `< >`
are placeholders.

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `<railway-public-url>` | **No trailing slash.** PayPal bakes this into every `return_url`; a mismatch sends users to a 404. |
| `DB_CLIENT` | `mysql2` | Keeps the door open for the later Hetzner / Postgres swap. |
| `DB_HOST` | `${{MySQL.MYSQL_HOST}}` | Use Railway variable references so rotations propagate. |
| `DB_USER` | `${{MySQL.MYSQL_USER}}` | |
| `DB_PASSWORD` | `${{MySQL.MYSQL_PASSWORD}}` | |
| `DB_NAME` | `${{MySQL.MYSQL_DATABASE}}` | |
| `DB_PORT` | `${{MySQL.MYSQL_PORT}}` | |
| `JWT_SECRET` | `<48-byte base64>` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` — generate FRESH, don't reuse a dev secret. |
| `APP_ENCRYPTION_KEY` | `<32-byte base64>` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Used for AES-256-GCM on Zoom/PayPal refresh tokens. |
| `PAYPAL_CLIENT_ID` | `<sandbox client id>` | Start on sandbox; flip to live in step 4 below. |
| `PAYPAL_CLIENT_SECRET` | `<sandbox client secret>` | |
| `PAYPAL_ENV` | `sandbox` | |
| `STORAGE_ENABLED` | `false` | Disables InstaPay / uploads entirely — US path is storage-free and Railway's FS is ephemeral. |

Do **not** set `PAYMOB_*`, `ZOOM_*`, `CRON_SECRET`, `PAYPAL_API_BASE`, or
`UPLOADS_DIR` at launch — those are dormant / test-only.

---

## 3. Database migrations (release phase)

Railway supports release commands that run after a successful build and
before traffic cuts over. Configure:

```
Service → Settings → Deploy → Custom Start Command: yarn start
Service → Settings → Deploy → Pre-deploy Command:  yarn migrate:up
```

(If the Railway UI wording differs, search for "release command" or
"pre-deploy command".) The deploy must fail if migrations fail — this is
the default for Railway pre-deploy commands. **Do not** run `migrate:up`
manually from a shell after deploy; it races with serving traffic.

Migrations are forward-only. To roll back a bad release, `railway rollback`
the app AND (if the migration was schema-destructive) run `yarn migrate:down`
locally against the production DB from a maintenance window.

---

## 4. PayPal sandbox → live switchover

Do this AFTER completing one sandbox smoke test (step 5).

1. In the PayPal Developer Dashboard, open your app under "My Apps &
   Credentials" → **Live** tab. Flip the app toggle to Live. Copy:
   - Live Client ID
   - Live Client Secret
2. In Railway, update:
   - `PAYPAL_CLIENT_ID` → live client ID
   - `PAYPAL_CLIENT_SECRET` → live client secret
   - `PAYPAL_ENV` → `live`
3. Trigger a redeploy (Railway → Deployments → Redeploy, or push a
   no-op commit). The release migration step still runs but is a no-op.
4. Tail the first post-deploy log line and confirm:
   ```
   [composition] PaymentGateway: PayPalGateway (live)
   ```
   If it says `sandbox`, `PAYPAL_ENV` didn't propagate — fix before taking
   real money.

---

## 5. Post-deploy smoke test (~5 min, manual)

Run this on sandbox BEFORE step 4, and again on live AFTER step 4.

1. Open `NEXT_PUBLIC_APP_URL` in a fresh incognito window → homepage loads
   (HTTP 200, no console errors).
2. Log in with a real student account (not a seed user).
3. From the student dashboard, pick an instructor → pick a slot → proceed
   to pay. Use a real `$1` test course for the live smoke.
4. Click **Pay with PayPal** → complete the flow on PayPal → you should
   be bounced back to `…/student/bookings/<id>/return` with
   **"Session confirmed — barakAllāhu fīk"**.
5. In the DB (Railway → MySQL → Query), verify:
   ```sql
   SELECT id, status, payment_method, payment_id, transaction_id, amount
   FROM bookings WHERE id = <id>;
   ```
   Expected:
   - `status='confirmed'`
   - `payment_method='paypal'`
   - `payment_id` starts with the PayPal order id
   - `transaction_id` is populated (the PayPal capture id)
6. Hard-refresh the `/return` URL. You should still see "Session
   confirmed" — no error, no duplicate capture. This proves the
   return-path idempotency in production.
7. (Live smoke only) Refund the test capture from the PayPal dashboard
   so you aren't sitting on a real-money test charge.

---

## 6. Rollback

If a deploy is misbehaving:

1. Railway → Deployments → previous healthy deploy → **Rollback to this
   deploy**. This reverts the app image but **not** the database schema.
2. If a destructive migration shipped with the bad deploy, either:
   - Reverse it by hand with `yarn migrate:down` from a trusted shell, or
   - Leave the schema forward and ship a compatibility fix as a new
     deploy (preferred — down-migrations are often lossy).

For PayPal-only issues (bad keys, wrong env), you don't need a code
rollback — just correct the Railway variables and redeploy. PayPal will
not double-charge; the order either captured or it didn't.

---

## 7. Known gaps at launch

These are deliberately deferred and tracked as post-launch follow-ups:

- **PayPal webhook verification** — `PayPalGateway.verifyWebhook()` and
  `parseWebhookEvent()` return `false` / throw `not wired`. Confirmation
  at launch is synchronous on the `/return` page. A dropped return means
  the booking stays in `pending_payment` until a cron sweeps it — we
  accept that risk for the 2-day launch.
- **InstaPay** — disabled via `STORAGE_ENABLED=false`. Will come back
  after R2 storage is wired.
- **Zoom meeting creation** — dormant. Bookings confirm without a meeting
  link; UI shows *"meeting link pending"* and the instructor is expected
  to email the student manually. Zoom OAuth + auto-meeting-creation is
  tracked as Phase 5 of the original MVP plan.
- **Concurrent-slot E2E** — covered by the DB-level unique constraint
  (`uniq_bookings_slot_hold`) and unit tests, but not yet in Playwright.
