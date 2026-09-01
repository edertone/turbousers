# User Service

A self-contained **user management microservice** built with **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**. It provides a REST API for storing and managing users for any application, plus a built-in server-rendered **dashboard** to list, create, edit, and operate on users.

The service is **Dockerized** and ready to be consumed by any other application via its HTTP API. It ships with full authentication (JWT + refresh token rotation), role-based access control (RBAC), and automatic database seeding on first launch.

> **Containerized only.** This project is designed to run **exclusively inside Docker** as a microservice.

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

## Documentation

| Topic | Description |
| ----- | ----------- |
| [Quick start](docs/quickstart.md) | Run the stack with Docker, plus development workflow. |
| [Configuration](docs/configuration.md) | All environment variables and their defaults. |
| [Seeding](docs/seeding.md) | Auto-seeded admin and demo users. |
| [API reference](docs/api-reference.md) | Full endpoint documentation (auth, users, roles, health). |
| [Data model](docs/data-model.md) | Tables and columns, plus password rules. |
| [Dashboard](docs/dashboard.md) | The built-in server-rendered admin dashboard. |
| [Integration guide](docs/integration.md) | Consume the service from your own application. |
| [Project structure](docs/project-structure.md) | Repository layout and available scripts. |

---

## Quick start

```bash
# optional: copy defaults, then edit secrets
cp .env.example .env

docker compose up --build -d
```

Once the containers are healthy:

- Dashboard: <http://localhost:3000/dashboard>
- Health check: <http://localhost:3000/api/health>
- API base URL: <http://localhost:3000/api>

Stop the stack: `docker compose down` — or `docker compose down -v` to wipe data and volumes (fresh start, re-seeds).

Full instructions in [Quick start](docs/quickstart.md).

---
