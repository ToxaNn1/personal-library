FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/contracts ./packages/contracts
COPY packages/db ./packages/db
RUN pnpm --filter @library/web build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
