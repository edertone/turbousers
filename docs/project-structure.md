# Project structure

```
src/
├── auth/          # register/login/refresh/logout + JWT strategy
├── users/         # user CRUD, RBAC guard
├── dashboard/     # server-rendered dashboard (controller + inline views)
├── health/        # health check endpoint
├── prisma/        # PrismaModule, PrismaService, seed
└── common/        # shared guards and decorators (roles, current-user)
prisma/
├── schema.prisma  # data model
└── migrations/    # SQL migrations
```

> The tree above is approximate. For the canonical tree see the `prisma/` and `src/` directories in the repository root.

## Available scripts

These run **inside the container** (via `docker compose exec app ...`) — they are not for a local host workflow.

| Script                 | Description |
| ---------------------- | ----------- |
| `npm start`            | Start the service via `ts-node` (no build step). |
| `npm run seed`         | Run the seeder. |
| `npm run prisma:migrate` | Create/apply dev migration. |
| `npm run prisma:deploy`  | Apply migrations against the database. |
| `npm run prisma:studio`  | Open Prisma Studio. |
| `npm run lint`         | Lint source/test files. |
| `npm test`             | Run unit tests. |