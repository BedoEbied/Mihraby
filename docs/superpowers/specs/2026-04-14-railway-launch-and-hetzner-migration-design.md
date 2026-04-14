# Railway Launch + Hetzner/Coolify Migration — Design

**Date:** 2026-04-14
**Branch:** `release/us-launch`
**Status:** Approved — ready for implementation planning
**Supersedes nothing; complements:** `~/.claude/plans/fancy-twirling-harp.md` (Phases 5/7)

---

## Goal

Deploy `release/us-launch` to **Railway** today so the PayPal booking critical path works end-to-end on a public URL. Bake in the minimum portability primitives so the later **Hetzner + Coolify** migration is mechanical, not a rewrite.

**Non-goals (deferred, see §8):** structured logging, Sentry, R2 storage, custom domain, holds/reconcile cron, Postgres, multi-region.

---

## Decisions (from brainstorming session)

1. **Database at launch:** Railway MySQL plugin. Do not migrate to Postgres now. Parameterize code so the later swap is a targeted PR, not a rewrite.
2. **File storage at launch:** No Railway Volume mounted. InstaPay is dormant at US launch and PayPal is storage-free. `LocalDiskStorage` is replaced at runtime by a `DisabledStorage` stub that returns a 503-mapped error if anything calls `getFileStorage()`. Volume is a contingency *only* if InstaPay is re-enabled before the Hetzner migration. R2 is a named post-launch track item — skipped today per user direction.
3. **Custom domain:** Launch on the Railway-generated `*.up.railway.app` URL. Custom domain is a post-launch track item.
4. **Observability:** No pino, no Sentry at launch. `console.log` + Railway's text log stream are acceptable for day 1. Structured logging is a named post-launch track item — skipped today per user direction.
5. **Container strategy:** Dockerfile from day 1 (multi-stage, `output: 'standalone'`). Railway deploys via its Docker build path. The same image will be reused by Coolify on Hetzner — portability invariant is *"the container is self-contained; the platform only supplies env vars and $PORT."*

---

## Architecture at launch

```
[ Student browser ]
        │ HTTPS
        ▼
[ Railway service: Next.js standalone ]   ← Dockerfile, reads $PORT, HOSTNAME=0.0.0.0
        │                    │
        │                    └─► PayPal REST API (sandbox → live)
        ▼
[ Railway MySQL plugin ]       [ no volume, no object storage, no cron ]
```

Single Railway service, single Railway MySQL database. `NEXT_PUBLIC_APP_URL` = Railway-generated `*.up.railway.app`. Health check wired to `/api/health`.

---

## Work items (today)

| # | File / action | Change |
|---|---|---|
| 1 | `next.config.ts` | Set `output: 'standalone'` |
| 2 | `Dockerfile` (new) | Multi-stage (deps / builder / runner). Runner = `node:20-alpine`, non-root `nextjs:nodejs`, copies `.next/standalone`, `public`, `.next/static`, `migrations/`, `knexfile.ts`. `CMD ["node", "server.js"]`. `ENV HOSTNAME=0.0.0.0 PORT=3000`. |
| 3 | `.dockerignore` (new) | `node_modules`, `.next`, `.git`, `.env*`, `uploads/`, `coverage`, `playwright-report`, `tests/`, `docs/` |
| 4 | `package.json` | Add `"engines": { "node": ">=20 <21" }` |
| 5 | `app/api/health/route.ts` (new) | `GET` returns `{ status: 'ok', uptime, db: 'ok' \| 'down' }` after a `SELECT 1` probe against the pool. Returns 200 on healthy DB, 503 on DB failure. No auth. |
| 6 | `knexfile.ts` | Read `client: process.env.DB_CLIENT ?? 'mysql2'` — zero behavior change at launch; enables later Postgres swap via env var. |
| 7 | `lib/composition.ts` | When `STORAGE_ENABLED !== 'true'`, `getFileStorage()` returns a `DisabledStorage` stub whose every method throws a clearly-messaged error mapped to HTTP 503 by the API route wrapper. Default at launch: unset → disabled. |
| 8 | `lib/storage/DisabledStorage.ts` (new) | Implements `FileStorage` with all methods throwing `new ApiError('Storage disabled at launch', 503)`. |
| 9 | `.env.example` | Verify it already includes: `PAYPAL_*`, `NEXT_PUBLIC_APP_URL`, `DB_*`, `JWT_SECRET`, `APP_ENCRYPTION_KEY`. Add: `DB_CLIENT=mysql2`, `STORAGE_ENABLED=false`. |
| 10 | Railway project setup | Create project → attach MySQL plugin → connect GitHub repo → deploy from `release/us-launch` branch → set all env vars from (9) → configure health check path `/api/health`. |
| 11 | DB migrate | From local shell against Railway MySQL (credentials copied from Railway dashboard): `npx knex --knexfile knexfile.ts migrate:latest`. Migrations are **not** run inside the container to avoid shipping ts-node in the runner stage. |
| 12 | Sandbox E2E | Against the live `*.up.railway.app` URL: create a `meeting_platform='manual'` course → student login → pick slot → initiate booking → redirect to PayPal sandbox → approve with sandbox buyer account → land on `/return` → see "Booking confirmed" → verify DB row `status='confirmed'`, `payment_status='paid'`, `transaction_id` populated. |
| 13 | Launch smoke | `curl https://<app>.up.railway.app | grep -i egypt` → empty. `grep -i paymob` → empty. Landing page renders, timezone shows Central Time, payment picker shows PayPal only. |

### Dockerfile contract (the critical bit)

Multi-stage, target image ≤ 200 MB:

1. **`deps`** — `node:20-alpine`. Copy `package.json`, `yarn.lock`. `yarn install --frozen-lockfile`.
2. **`builder`** — `node:20-alpine`. Copy `deps`' `node_modules` + full source. `yarn build`. Produces `.next/standalone` (self-contained `server.js`) and `.next/static`.
3. **`runner`** — `node:20-alpine`. Non-root user `nextjs:nodejs` (UID/GID 1001). Copy `.next/standalone`, `public`, `.next/static`, `migrations/`, `knexfile.ts`. `ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000`. `EXPOSE 3000`. `USER nextjs`. `CMD ["node", "server.js"]`.

The standalone `server.js` reads `$PORT` and `$HOSTNAME` from env, which satisfies Railway's $PORT contract cleanly. No `next start` wrapper needed.

**Why migrations are copied into the runner:** so an operator can `railway run npx knex migrate:latest` from a Railway shell if the local-shell approach is unavailable. But the default path is **local shell → Railway MySQL**.

---

## Failure modes & mitigations

| # | Failure | Detection | Mitigation |
|---|---|---|---|
| 1 | Server binds to :3000, Railway routes $PORT | Deploy health check fails | `standalone` server.js reads `$PORT` + `$HOSTNAME` automatically |
| 2 | Migrations not run against prod DB | App starts but any DB query hits missing tables | Run `migrate:latest` from local shell *before* first deploy; verify with a health check that includes a trivial `SELECT 1` from a known table |
| 3 | Student approves PayPal, closes tab before return | Booking stuck `pending_payment` forever | **Documented manual cleanup** (same as original plan §Risk row 1): admin runs `UPDATE bookings SET status='cancelled' WHERE status='pending_payment' AND created_at < NOW() - INTERVAL 30 MINUTE` once a day. Automated reconcile cron is a post-launch track item. |
| 4 | Someone hits `/api/bookings/[id]/payment-proof` or admin payment-proofs route | 500 from storage layer | `STORAGE_ENABLED=false` gate → `DisabledStorage` → clean 503 with explicit message |
| 5 | PayPal live-mode flip without verified Business account | Real-money capture fails | Sandbox is the default (`PAYPAL_ENV=sandbox`). Live flip is gated on manual developer.paypal.com verification. |
| 6 | `NEXT_PUBLIC_APP_URL` unset → `metadataBase` falls back to `localhost` | OG previews broken | Required in `.env.example`. Verify on Railway before the smoke test. |
| 7 | Container runs as root | Any RCE hits root | `USER nextjs` in Dockerfile runner stage |

---

## Portability invariants (must not break)

These are the rules the Hetzner+Coolify migration relies on. Do not violate without updating this doc:

1. **The container is self-contained.** No hard-coded hostnames, no filesystem writes outside `/tmp`, no reliance on Railway-specific env vars.
2. **All configuration is via env vars.** No code path reads a Railway-only env var (e.g., `RAILWAY_*`) without a safe fallback.
3. **No local file storage is written at launch.** `DisabledStorage` enforces this at runtime. InstaPay routes remain reachable by admin but return 503.
4. **Database client is parameterized** via `DB_CLIENT` even though the default stays `mysql2`. Future Postgres swap is a one-line env change + the targeted schema/errno PR.
5. **Health check is platform-agnostic** — `/api/health` is just an HTTP GET, works on Railway and Coolify identically.

---

## Verification checklist (launch-ready)

Copy from `~/.claude/plans/fancy-twirling-harp.md` §Verification, plus:

- [ ] `Dockerfile` builds locally: `docker build -t mihraby . && docker run -p 3000:3000 --env-file .env mihraby` reaches landing page on :3000
- [ ] `.dockerignore` excludes `node_modules`, `.env*`, `uploads/`
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `GET /api/health` returns 200 with `db: 'ok'` locally
- [ ] `GET /api/health` returns 503 when DB is paused (smoke-test by temporarily breaking `DB_HOST`)
- [ ] `GET /api/bookings/xxx/payment-proof` with any bookingId returns 503 (Storage disabled)
- [ ] Railway deploy succeeds, `*.up.railway.app` reaches landing page
- [ ] Railway health check is green
- [ ] Sandbox PayPal E2E passes against the live Railway URL
- [ ] DB row shows `status='confirmed'` and populated `transaction_id`
- [ ] Landing-page grep: no "Egypt", no "Paymob", no "Vodafone", no "Fawry"
- [ ] Container runs as non-root (`docker exec <container> id` shows UID 1001)

---

## Post-launch track (explicitly deferred, each gets its own spec when triggered)

Backlog, prioritized. Each item has its own ticket / spec once started. Listed here so **nothing is lost** between launch and the Hetzner migration.

### T1 — Custom domain + TLS
- Buy / verify domain, add DNS records, configure Railway custom domain, wait for TLS issue, update `NEXT_PUBLIC_APP_URL`, re-verify PayPal `return_url` / `cancel_url` configuration.
- Blocks: T6 (Hetzner migration — DNS move is cheaper from a custom domain than from a Railway subdomain).

### T2 — PayPal live-mode flip
- Verify Business account at developer.paypal.com, grab live `client_id` / `client_secret`, flip `PAYPAL_ENV=live` on Railway, re-run sandbox E2E with a real PayPal live account and a $1 test course, remove test course.
- Gated on: verified Business account (days-to-weeks at PayPal if application is needed).

### T3 — `R2Storage` implementation *(skipped today, explicitly noted)*
- New `lib/storage/R2Storage.ts` implementing `FileStorage`. Uses `@aws-sdk/client-s3` against R2's S3-compatible endpoint.
- Composition-root branch: when `STORAGE_ENABLED=true` and `R2_*` env vars are present, return `R2Storage`; otherwise fall through to `DisabledStorage` (never `LocalDiskStorage` in prod).
- Env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL_BASE` (optional, if public-readable assets are needed).
- Unblocks: InstaPay re-enablement, PayPal webhook artifact storage (if ever needed), user avatar uploads.
- **Why skipped today:** InstaPay is dormant at launch. PayPal path is storage-free. Adding an unused external dependency right before a launch push is negative-EV.

### T4 — Structured logging + Sentry *(skipped today, explicitly noted)*
- Add `pino` (JSON logs to stdout — Railway captures stdout natively). Replace `console.log` sprinkles across `lib/services/**` and `app/api/**`.
- Add Sentry SDK (`@sentry/nextjs`) for error aggregation. DSN via `SENTRY_DSN` env var.
- **Why skipped today:** one more thing to validate before the launch push. `console.log` + Railway text logs are sufficient for day-1 triage.

### T5 — Holds cron + PayPal reconciliation cron
- `POST /api/cron/expire-holds` — authed via `CRON_SECRET` header. Cancels `pending_payment` bookings older than 30 minutes, releasing the slot.
- `POST /api/cron/reconcile-paypal` — for any `pending_payment` booking with a stashed `providerSessionId`, calls PayPal `GET /v2/checkout/orders/{id}` and confirms or cancels based on the order's actual state. Catches the "student closed the tab mid-flow" stranded booking risk.
- Triggered by Railway's cron feature or an external pinger (cron-job.org).

### T6 — Hetzner + Coolify migration (see §7 below)

---

## Hetzner + Coolify migration — outline

### Trigger
2–4 weeks after launch, after the PayPal + booking flow has been exercised by real users with **zero critical incidents for 7 consecutive days**.

### Prerequisites (must land on Railway first)
- **T3 (R2Storage)** wired and proven. File storage MUST NOT be touched during the migration.
- **T4 (structured logging)** landed. So we can diff logs across the move and have Sentry alerts wired before we cut traffic.
- **T1 (custom domain)** on Railway. So the final cutover is a DNS update, not a new cert request on Coolify.

### Steps (high-level — each gets a task list in the implementation plan)

1. **Provision Hetzner VM.** Cloud CX32 (4 vCPU / 8 GB) or CPX21 (AMD EPYC / 3 vCPU / 4 GB) as the starting size. Ubuntu 24.04 LTS.
2. **Install Coolify** via the official one-line installer. Configure with a temporary subdomain (e.g., `staging.<domain>`) and a Let's Encrypt cert.
3. **Point Coolify at the same GitHub repo.** Select Dockerfile build path. Verify Coolify builds **the identical image** Railway builds (compare image digest or the `yarn build` output size).
4. **Provision Postgres** via Coolify's one-click Postgres service. Set a long random password, store in Coolify's secret manager.
5. **Postgres schema port (the one real code change in the migration):**
   - New migration `migrations/<date>-postgres-compat.ts` that, when run on Postgres, creates the `bookings.slot_hold` column with Postgres-native `GENERATED ALWAYS AS (...) STORED` syntax.
   - Replace `INT UNSIGNED` → `INTEGER` across all migrations (or gate by `knex.client.config.client`).
   - Swap `ON DUPLICATE KEY UPDATE` in `InstructorIntegration.ts` → `INSERT ... ON CONFLICT (...) DO UPDATE SET ...`.
   - Update `isDuplicateEntryError()` in `lib/db/transaction.ts` to check both MySQL errno `1062` **and** Postgres SQLSTATE `23505`.
   - Add `pg` to `dependencies`. Switch `DB_CLIENT=pg` in Coolify env.
6. **Data migration (one-time).** Options, in order of preference:
   - `pgloader` with a MySQL → Postgres config file (handles type coercion automatically).
   - Dump MySQL → convert → load Postgres manually if `pgloader` chokes.
   - Run against a **test Postgres first** with a recent dump; verify row counts match; spot-check 10 random bookings.
7. **Re-point R2 credentials** in Coolify env (no data move — same bucket keeps serving both environments during the cutover).
8. **Pre-flip re-test matrix** on `staging.<domain>`:
   - Concurrent booking for the same slot → exactly one winner (the critical path exercising the 1062 → 23505 error mapping).
   - PayPal sandbox E2E.
   - Health check green.
   - R2 read/write verified.
   - Log lines reaching Sentry.
9. **Lower TTL to 60s** on the main domain's CNAME 24 hours before the flip.
10. **DNS flip.** Update CNAME from Railway to Coolify. Monitor Sentry + health check.
11. **Keep Railway running read-only / warm-standby for 48 hours.** So rollback = single DNS edit.
12. **Decommission Railway** after 7 days of stability on Hetzner.

### Rollback plan
DNS flip back to Railway. Because Railway stays warm for 48h, RTO = DNS TTL (~60s).

### Cost estimate (rough)
- Railway at current scale: ~$20–40/month (service + MySQL).
- Hetzner CX32 + Coolify + Postgres: ~$8–12/month (Hetzner hardware) + $0 (Coolify is self-hosted).
- Savings justify the migration only if traffic grows; early-days this is mostly about ownership and durability, not cost.

---

## Critical files to be modified (this launch spec only)

**New files:**
- `Dockerfile`
- `.dockerignore`
- `app/api/health/route.ts`
- `lib/storage/DisabledStorage.ts`
- `docs/superpowers/specs/2026-04-14-railway-launch-and-hetzner-migration-design.md` (this file)

**Modified:**
- `next.config.ts` — add `output: 'standalone'`
- `package.json` — add `engines.node`
- `knexfile.ts` — parameterize client via `DB_CLIENT`
- `lib/composition.ts` — `getFileStorage()` honors `STORAGE_ENABLED`
- `.env.example` — add `DB_CLIENT`, `STORAGE_ENABLED`

**Unchanged (intentionally):**
- Any PayPal, booking, or DB query code. The launch plan pivot committed in `512a963` is already correct.
- `lib/storage/LocalDiskStorage.ts` — preserved for Egypt/InstaPay work, never reached when `STORAGE_ENABLED=false`.
- `lib/format.ts` — already uses `$`.

---

## Open questions (none blocking)

None. Custom domain, PayPal live flip, observability, R2, and Postgres are all explicitly deferred to the post-launch track.
