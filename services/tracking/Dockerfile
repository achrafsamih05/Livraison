# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV CI=true
COPY package.json ./
COPY prisma ./prisma
# Strip workspace-protocol deps (e.g. the shared eslint-config) that npm cannot resolve in a
# standalone build context. They are lint-only and not needed to build or run the service.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));for(const d of ['dependencies','devDependencies']){if(!p[d])continue;for(const k of Object.keys(p[d])){if(String(p[d][k]).startsWith('workspace:'))delete p[d][k];}}fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nodejs
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/generated ./generated
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
USER nodejs
EXPOSE 3003
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
