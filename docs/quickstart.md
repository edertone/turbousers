# Quick start (Docker)

The fastest way to run the whole stack (app + PostgreSQL) is Docker Compose:

```bash
# optional: copy defaults, then edit secrets
cp .env.example .env

docker compose up --build -d
```

Once the containers are healthy:

- Dashboard: <http://localhost:3000/dashboard>
- Health check: <http://localhost:3000/api/health>
- API base URL: <http://localhost:3000/api>

On a fresh database the service **automatically** runs migrations and seeds an admin account plus a few demo users (see [Seeding](seeding.md)).

Default seeded admin (change via env, never use in production):

| Field    | Default            |
| -------- | ------------------ |
| Email    | `admin@usersvc.local` |
| Password | `admin123`         |

Stop the stack:

```bash
docker compose down
```

Wipe data **and** volumes (fresh start, re-seeds):

```bash
docker compose down -v
```

## Development

This project **does not** run outside of Docker. There is no local `dist` build, no `start:dev`, and no compilation step — the container runs TypeScript directly via `ts-node`.

To develop, edit the source and rebuild/restart the containers:

```bash
docker compose up --build -d
docker compose logs -f app
```

To run a one-off command inside the running container (e.g. interactive Prisma Studio):

```bash
docker compose exec app npm run prisma:studio
```