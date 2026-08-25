FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY packages/contracts ./packages/contracts
COPY packages/db ./packages/db
RUN pnpm --filter @library/api build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY packages/db/drizzle ./packages/db/drizzle

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["sh", "-c", "node apps/backend/dist/migrate.js && node apps/backend/dist/index.js"]
