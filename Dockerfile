# syntax=docker/dockerfile:1.7
#
# Mihraby — production image.
# Multi-stage build producing a ~200 MB self-contained Next.js standalone
# runner. Same image is used on Railway (day 1) and on Coolify+Hetzner
# (post-launch migration). The platform only supplies env vars + $PORT.

# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Non-root user — any RCE is scoped to an unprivileged account.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output is self-contained: a minimal server.js + its
# specific node_modules subset. No `yarn install` in the runner.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# The standalone server reads PORT + HOSTNAME from the environment,
# satisfying Railway's $PORT contract without a `next start` wrapper.
CMD ["node", "server.js"]
