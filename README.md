# Personal Library

A focused Goodreads alternative — your personal record of what you've read, are reading, and intend to read. Coursework project.

## Stack (current)

- **pnpm** workspaces + **Turborepo**
- **TypeScript** 5 strict
- **Hono** + **oRPC** — typed backend
- **Drizzle ORM** — type-safe DB access + migrations (`packages/db`)
- **Nuxt 4** + **Tailwind CSS 4** — frontend
- **Zod** — validation at the boundaries
- **ESLint 9** + **Prettier 3**
- **PostgreSQL 16** in Docker (via docker-compose)

## Database

PostgreSQL 16 in Docker. Start it:

```bash
docker compose up -d        # starts the library-postgres container
docker compose ps           # check status (healthy)
docker compose logs -f      # follow logs
docker compose down         # stop (volume is kept)
```

Connection parameters:

- Host: `localhost`
- Port: `5432`
- Database: `library`
- User: `postgres`
- Password: `postgres`

URL: `postgres://postgres:postgres@localhost:5432/library`

The backend and Drizzle tooling read `DATABASE_URL` from `apps/backend/.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/library
```

## Structure

```
personal-library/
├── apps/
│   ├── backend/   Hono + oRPC API (port 3001), N-Layer modules
│   └── web/       Nuxt 4 + Tailwind frontend (port 3000)
├── packages/
│   ├── contracts/ Shared oRPC contract + Zod schemas
│   └── db/        Drizzle schema, client, and migrations
├── docker/
│   └── postgres-init/   Postgres init scripts
└── docker-compose.yml
```

## Run everything in Docker

```bash
docker compose up -d --build     # postgres + redis + api, all healthchecked
curl localhost:3001/health       # 200 when db and redis are both reachable
```

The API image is a multi-stage build (`apps/backend/Dockerfile`): the builder bundles the
app with tsup, the runtime stage keeps only production dependencies and runs as the
non-root `node` user.

## Getting started

```bash
pnpm install
docker compose up -d                          # start Postgres
pnpm --filter @library/db db:migrate          # apply migrations
pnpm --filter @library/db db:seed             # seed test data
pnpm dev                                      # run backend + frontend
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Working with the schema (Drizzle)

```bash
pnpm --filter @library/db db:generate   # generate a migration after editing schema.ts
pnpm --filter @library/db db:migrate    # apply migrations
pnpm --filter @library/db db:seed       # seed test data (idempotent)
pnpm --filter @library/db db:studio     # open Drizzle Studio
```

## Deploying to Railway

The image, the health check and the migration step are already wired; what follows is the
one-time setup on Railway's side.

```bash
npm i -g @railway/cli
railway login
railway init                     # creates the project and its production environment
railway add --database postgres
railway add --database redis
```

Set the service variables. Reference the databases rather than pasting their URLs, so a
rotated password cannot silently break the service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `WEB_ORIGIN` | the origin the frontend is served from; comma-separated for more than one |
| `TRUST_PROXY` | `true` — Railway terminates TLS in front of the app |

```bash
railway up                       # first deploy from local source
railway domain                   # public URL + certificate
railway logs
```

`railway.json` tells Railway to build `apps/backend/Dockerfile`, run
`node apps/backend/dist/migrate.js` **before** the new version receives traffic, and poll
`/health` until it answers 200. A failed migration or an unhealthy container leaves the previous
deployment serving.

After the first deploy, pushing to `main` is the deploy command.

To roll back, redeploy the previous deployment from the Railway dashboard. Note that a rollback
returns the code, not the schema — which is why migrations only ever add.
