# Configuration

Environment variables. All variables have safe defaults. **Always override the secrets in production.**

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