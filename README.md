# Personal Library

Курсова робота

## Стек (поточний)

- **pnpm** workspaces + **Turborepo**
- **TypeScript** 5 strict
- **Hono** + **oRPC** — бекенд з типами
- **Nuxt 4** + **Tailwind CSS 4** — фронт
- **Zod** — валідація на межах
- **ESLint 9** + **Prettier 3**
- **PostgreSQL 16** у Docker (через docker-compose)

## База даних

PostgreSQL 16 у Docker. Підняти:

```bash
docker compose up -d        # стартує контейнер library-postgres
docker compose ps           # перевірити стан (healthy)
docker compose logs -f      # дивитись логи
docker compose down         # зупинити (volume лишається)
```

Параметри підключення:

- Host: `localhost`
- Port: `5432`
- Database: `library`
- User: `postgres`
- Password: `postgres`

URL: `postgres://postgres:postgres@localhost:5432/library`

## Структура

```
personal-library/
├── apps/
│   ├── backend/   Hono + oRPC API (порт 3001)
│   └── web/       Nuxt 4 + Tailwind фронтенд (порт 3000)
├── packages/
│   └── contracts/ Спільні oRPC контракти + Zod-схеми
├── docker/
│   └── postgres-init/   ініціалізаційні скрипти Postgres
└── docker-compose.yml
```

## Старт

```bash
pnpm install
docker compose up -d        # підняти Postgres
pnpm dev                    # запустити backend + frontend
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
