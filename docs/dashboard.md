# Dashboard

A server-rendered dashboard is served by NestJS at **`/dashboard`** (index redirects there), with two tabs:

- **Users** — list with pagination, search and role/status filters; create users; edit a user's profile fields, **roles**, **JSON data** and status; delete users.
- **Roles** — create, edit (name/description/JSON data) and delete configurable roles.

Log in with `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`.

The dashboard uses its own session cookie (`dashboard_token`) signed with `DASHBOARD_SECRET`. If served over plain HTTP keep `COOKIE_SECURE=false`; set it to `true` for HTTPS.

See [Configuration](configuration.md) for the relevant environment variables.