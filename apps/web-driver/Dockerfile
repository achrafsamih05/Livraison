# syntax=docker/dockerfile:1.7
# Build context MUST be the monorepo root: docker build -f apps/web-driver/Dockerfile .

ARG NODE_VERSION=20-bookworm-slim

FROM node:${NODE_VERSION} AS builder
WORKDIR /repo
ENV CI=true NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web-driver ./apps/web-driver
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @livraison/web-driver...
RUN pnpm --filter @livraison/web-driver build

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3102 HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-driver/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-driver/.next/static ./apps/web-driver/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web-driver/public ./apps/web-driver/public
USER nextjs
EXPOSE 3102
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web-driver/server.js"]
