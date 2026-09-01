# Consuming from another application

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

See the [API reference](api-reference.md) for full endpoint details.