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
