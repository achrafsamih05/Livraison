# syntax=docker/dockerfile:1.7

# --- Builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV CI=true
RUN corepack enable
COPY package.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# --- Runtime ---
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nodejs
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
USER nodejs
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
