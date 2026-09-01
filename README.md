# User Service

A self-contained **user management microservice** built with **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**. It provides a REST API for storing and managing users for any application, plus a built-in server-rendered **dashboard** to list, create, edit, and operate on users.

The service is **Dockerized** and ready to be consumed by any other application via its HTTP API. It ships with full authentication (JWT + refresh token rotation), role-based access control (RBAC), and automatic database seeding on first launch.

> **Containerized only.** This project is designed to run **exclusively inside Docker** as a microservice. It is not set up for a local dev server, a `dist` build, or a local compilation step — everything runs through the container (TypeScript is executed directly via `ts-node`).

---

## Features

- **REST API** — full CRUD for users with pagination, filtering, and search.
- **Authentication** — register, login, refresh (with rotation), logout, and "me".
- **Configurable RBAC** — create/edit roles with descriptions and arbitrary JSON data; assign **multiple** roles to users; admin-only user/role management endpoints.
- **Arbitrary JSON data** — store any extra structured data on both users and roles.
- **Server-rendered dashboard** — a lightweight HTML/JS dashboard served by NestJS to manage users **and roles** (including role assignment and JSON data editing) without a separate frontend build.
- **PostgreSQL + Prisma** — type-safe data access with migrations.
- **Dockerized** — `docker compose up` gives a working stack (app + database) with auto-seeding.
- **Security** — bcrypt password hashing, refresh tokens stored hashed (SHA-256), helmet, guarded routes.

---

## Quick start (Docker)

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

On a fresh database the service **automatically** runs migrations and seeds an admin account plus a few demo users (see [Seeding](#seeding)).

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

---

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

---

## Environment variables

All variables have safe defaults. **Always override the secrets in production.**

| Variable                | Default                  | Description |
| ----------------------- | ------------------------ | ----------- |
| `NODE_ENV`              | `development`            | Runtime environment. |
| `PORT`                  | `3000`                   | HTTP port. |
| `HOST`                  | `0.0.0.0`                | Bind address. |
| `POSTGRES_HOST`         | `localhost` (`db` in compose) | PostgreSQL host. |
| `POSTGRES_PORT`         | `5432`                   | PostgreSQL port. |
| `POSTGRES_USER`         | `usersvc`                | PostgreSQL user. |
| `POSTGRES_PASSWORD`     | `usersvc_password`       | PostgreSQL password. |
| `POSTGRES_DB`           | `usersvc`                | PostgreSQL database name. |
| `DATABASE_URL`          | *(derived)*              | Full Prisma connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public`. |
| `JWT_ACCESS_SECRET`     | `change_me_access_secret`| Secret for signing access JWTs. |
| `JWT_REFRESH_SECRET`    | `change_me_refresh_secret` | Secret for signing refresh JWTs. |
| `JWT_ACCESS_EXPIRES_IN` | `15m`                    | Access token lifetime (e.g. `15m`, `1h`). |
| `JWT_REFRESH_EXPIRES_IN`| `7d`                     | Refresh token lifetime (e.g. `7d`). |
| `DASHBOARD_USERNAME`    | `admin`                  | Dashboard login username. |
| `DASHBOARD_PASSWORD`    | `admin123`               | Dashboard login password. |
| `DASHBOARD_SECRET`      | `change_me_dashboard_secret` | Secret used to sign the dashboard session cookie. |
| `COOKIE_SECURE`         | `false`                  | Set to `true` only when the dashboard is served **over HTTPS** so the cookie is flagged secure. |
| `SEED_ADMIN_EMAIL`      | `admin@usersvc.local`    | Email of the auto-seeded admin. |
| `SEED_ADMIN_PASSWORD`   | `admin123`               | Password of the auto-seeded admin. |
| `SEED_DEMO_USERS`       | `true`                   | Set to `false` to skip seeding the 5 demo users. |

---

## Seeding

On container startup the service ensures an initial **admin** exists, and optionally seeds 5 demo users:

| Email                  | Role  | Password  |
| ---------------------- | ----- | --------- |
| `admin@usersvc.local`  | ADMIN | `admin123` |
| `demo1@usersvc.local`  | USER  | `demo123`  |
| `demo2@usersvc.local`  | USER  | `demo123`  |
| `demo3@usersvc.local`  | USER  | `demo123`  |
| `demo4@usersvc.local`  | USER  | `demo123`  |
| `demo5@usersvc.local`  | USER  | `demo123`  |

Seeding is **idempotent** — existing users are never duplicated. Control it with the `SEED_ADMIN_*` and `SEED_DEMO_USERS` variables.

---

## API reference

Base URL: `http://localhost:3000/api`.

All user-management endpoints require a valid access token in the `Authorization: Bearer <token>` header, and are restricted to the `ADMIN` role (except `/api/auth` and `/api/users/me`). Because roles are configurable, RBAC checks are done by **role name**.

### Authentication

#### `POST /api/auth/register`

Create a self-service account (`ACTIVE`, no roles assigned — an admin assigns roles later).

```json
{
  "email": "person@acme.com",
  "password": "Str0ngPass",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

Returns the created public user object.

#### `POST /api/auth/login`

```json
{ "email": "admin@usersvc.local", "password": "admin123" }
```

Returns:

```json
{
  "user": { "id": "...", "email": "...", "roles": ["ADMIN"], "status": "ACTIVE", "data": null },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### `POST /api/auth/refresh`

Exchange a refresh token for a new pair (the old refresh token is rotated/revoked).

```json
{ "refreshToken": "..." }
```

Returns flat `{ "accessToken": "...", "refreshToken": "..." }`.

#### `POST /api/auth/logout`

Revoke a refresh token.

```json
{ "refreshToken": "..." }
```

Returns `{ "success": true }`.

#### `GET /api/auth/me`

`Authorization: Bearer <accessToken>`. Returns the current authenticated user.

### Users (ADMIN only, except `GET /api/users/me`)

#### `GET /api/users/me`

Any authenticated user. Returns the current user's public fields.

#### `GET /api/users`

List users with filtering and pagination. Admin only.

| Query param  | Type     | Description |
| ------------ | -------- | ----------- |
| `search`     | string   | Case-insensitive match on email / first / last name / phone. |
| `role`       | string   | Filter by role **name** (e.g. `ADMIN`, `MODERATOR`). |
| `status`     | `ACTIVE` \| `INACTIVE` | Filter by status. |
| `page`       | number   | Page number, default `1`. |
| `limit`      | number   | Page size, default `20`, max `100`. |
| `sortBy`     | string   | `createdAt` \| `email` \| `firstName` \| `lastName`, default `createdAt`. |
| `sortOrder`  | `asc` \| `desc` | Sort direction, default `desc`. |

Response (each user includes a `roles` array of `{ id, name, description }` and an arbitrary `data` JSON object):

```json
{
  "data": [ { "id": "...", "email": "...", "roles": [{ "id": "...", "name": "ADMIN", "description": null }], "data": null, "status": "ACTIVE" } ],
  "meta": { "page": 1, "limit": 20, "total": 6, "totalPages": 1 }
}
```

#### `POST /api/users`

Create a user (admin can set roles and status). Roles are referenced by their UUID `roleIds`.

```json
{
  "email": "new@acme.com",
  "password": "Str0ngPass",
  "firstName": "Grace",
  "lastName": "Hopper",
  "roleIds": ["<role-uuid>"],
  "status": "ACTIVE",
  "data": { "department": "eng", "locale": "en-US" }
}
```

#### `GET /api/users/:id`

Get a single user by UUID.

#### `PATCH /api/users/:id`

Partially update a user. All fields optional. `roleIds` replaces the user's full set of roles. `data` sets (or clears) the arbitrary JSON payload. You cannot deactivate your **own** account or remove the last `ADMIN` role from yourself.

```json
{ "firstName": "Grace", "roleIds": ["<admin-role-uuid>"], "data": { "level": 3 }, "emailVerified": true }
```

#### `PATCH /api/users/:id/status`

Set a user's status: `ACTIVE` or `INACTIVE`. You cannot deactivate your own account.

```json
{ "status": "INACTIVE" }
```

#### `PATCH /api/users/:id/password`

Reset a user's password.

```json
{ "password": "NewStr0ngPass" }
```

Returns `{ "success": true }`.

#### `DELETE /api/users/:id`

Delete a user. You cannot delete your own account.

Returns `{ "success": true, "id": "..." }`.

### Roles

Roles are configurable records with a unique `name`, an optional `description`, and arbitrary JSON `data`. A user can hold **many** roles, and a role can be assigned to **many** users. The default seed creates `ADMIN` and `USER`. All role endpoints are admin-only.

#### `GET /api/roles`

List all roles. Each entry includes a `userCount`.

#### `POST /api/roles`

Create a role. `name` is required and unique (letters, numbers, `_` and `-`).

```json
{ "name": "MODERATOR", "description": "Can moderate content", "data": { "permissions": ["read", "moderate"] } }
```

#### `GET /api/roles/:id`

Get a single role including `userCount` and the list of assigned `userIds`.

#### `PATCH /api/roles/:id`

Update a role's `name`, `description` or `data`.

```json
{ "description": "Can moderate content and users", "data": { "permissions": ["read", "moderate", "delete"] } }
```

#### `DELETE /api/roles/:id`

Delete a role. Fails if any user is still assigned to it.

#### `GET /api/roles/users/:userId`

Get the roles assigned to a user.

#### `PATCH /api/roles/users/:userId`

Replace the roles assigned to a user.

```json
{ "roleIds": ["<role-uuid-1>", "<role-uuid-2>"] }
```

#### `DELETE /api/roles/users/:userId/:roleId`

Remove a specific role from a user.

### Health

#### `GET /api/health`

```json
{ "status": "ok", "timestamp": "...", "db": "up" }
```

---

## Password rules

Passwords must be at least **8 characters** and contain at least one lowercase letter, one uppercase letter, and one **digit**.

---

## Data model

Four tables:

- **`users`** — `id` (UUID), `email` (unique), `passwordHash`, `firstName`, `lastName`, `phone`, `data` (arbitrary JSON), `status` (`ACTIVE`/`INACTIVE`), `emailVerified`, `lastLoginAt`, `createdAt`, `updatedAt`.
- **`roles`** — `id` (UUID), `name` (unique), `description`, `data` (arbitrary JSON), `createdAt`, `updatedAt`.
- **`user_roles`** — join table (`userId`, `roleId`) mapping users to roles (many-to-many), with cascade deletes.
- **`refresh_tokens`** — hashed refresh tokens with `expiresAt` and `revokedAt` (supporting rotation), foreign keyed to `users` with cascade delete.

---

## Dashboard

A server-rendered dashboard is served by NestJS at **`/dashboard`** (index redirects there), with two tabs:

- **Users** — list with pagination, search and role/status filters; create users; edit a user's profile fields, **roles**, **JSON data** and status; delete users.
- **Roles** — create, edit (name/description/JSON data) and delete configurable roles.

Log in with `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.

The dashboard uses its own session cookie (`dashboard_token`) signed with `DASHBOARD_SECRET`. If served over plain HTTP keep `COOKIE_SECURE=false`; set it to `true` for HTTPS.

---

## Consuming from another application

Point your backend at this service's API:

1. **Login** to get an access token:
   `POST /api/auth/login` with an admin (or the service account) credentials.
2. **Call user endpoints** with `Authorization: Bearer <accessToken>`.

Example (Node.js):

```ts
const res = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@usersvc.local', password: 'admin123' }),
});
const { tokens } = await res.json();

const users = await fetch(`${API_URL}/api/users`, {
  headers: { Authorization: `Bearer ${tokens.accessToken}` },
});
```

When a user logs into your application flow, you can:

- **Verify identity** with `GET /api/auth/me` using a token minted from a successful `login`.
- **Self-register** users with `POST /api/auth/register`.
- **Manage users** as an admin via the `/api/users` endpoints.

> **Note:** access tokens are short-lived (default 15m) and refresh tokens rotate, so design your integration to exchange a refresh token for a fresh pair rather than reusing tokens for long sessions.

---

## Project structure

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

---

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

---

## License

MIT