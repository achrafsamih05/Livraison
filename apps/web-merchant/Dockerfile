# syntax=docker/dockerfile:1.7
# Build context MUST be the monorepo root: docker build -f apps/web-merchant/Dockerfile .

ARG NODE_VERSION=20-bookworm-slim

# --- Dependencies + build ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /repo
ENV CI=true NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

# Copy workspace manifests first for cached installs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web-merchant ./apps/web-merchant
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @livraison/web-merchant...
RUN pnpm --filter @livraison/web-merchant build

# --- Runtime ---
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output (monorepo-aware: includes hoisted node_modules).
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-merchant/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-merchant/.next/static ./apps/web-merchant/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-merchant/public ./apps/web-merchant/public

USER nextjs
EXPOSE 3100
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web-merchant/server.js"]
