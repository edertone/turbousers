# API reference

Base URL: `http://localhost:3000/api`.

All user-management endpoints require a valid access token in the `Authorization: Bearer <token>` header, and are restricted to the `ADMIN` role (except `/api/auth` and `/api/users/me`). Because roles are configurable, RBAC checks are done by **role name**.

## Authentication

### `POST /api/auth/register`

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

### `POST /api/auth/login`

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

### `POST /api/auth/refresh`

Exchange a refresh token for a new pair (the old refresh token is rotated/revoked).

```json
{ "refreshToken": "..." }
```

Returns flat `{ "accessToken": "...", "refreshToken": "..." }`.

### `POST /api/auth/logout`

Revoke a refresh token.

```json
{ "refreshToken": "..." }
```

Returns `{ "success": true }`.

### `GET /api/auth/me`

`Authorization: Bearer <accessToken>`. Returns the current authenticated user.

## Users (ADMIN only, except `GET /api/users/me`)

### `GET /api/users/me`

Any authenticated user. Returns the current user's public fields.

### `GET /api/users`

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

### `POST /api/users`

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

### `GET /api/users/:id`

Get a single user by UUID.

### `PATCH /api/users/:id`

Partially update a user. All fields optional. `roleIds` replaces the user's full set of roles. `data` sets (or clears) the arbitrary JSON payload. You cannot deactivate your **own** account or remove the last `ADMIN` role from yourself.

```json
{ "firstName": "Grace", "roleIds": ["<admin-role-uuid>"], "data": { "level": 3 }, "emailVerified": true }
```

### `PATCH /api/users/:id/status`

Set a user's status: `ACTIVE` or `INACTIVE`. You cannot deactivate your own account.

```json
{ "status": "INACTIVE" }
```

### `PATCH /api/users/:id/password`

Reset a user's password.

```json
{ "password": "NewStr0ngPass" }
```

Returns `{ "success": true }`.

### `DELETE /api/users/:id`

Delete a user. You cannot delete your own account.

Returns `{ "success": true, "id": "..." }`.

## Roles

Roles are configurable records with a unique `name`, an optional `description`, and arbitrary JSON `data`. A user can hold **many** roles, and a role can be assigned to **many** users. The default seed creates `ADMIN` and `USER`. All role endpoints are admin-only.

### `GET /api/roles`

List all roles. Each entry includes a `userCount`.

### `POST /api/roles`

Create a role. `name` is required and unique (letters, numbers, `_` and `-`).

```json
{ "name": "MODERATOR", "description": "Can moderate content", "data": { "permissions": ["read", "moderate"] } }
```

### `GET /api/roles/:id`

Get a single role including `userCount` and the list of assigned `userIds`.

### `PATCH /api/roles/:id`

Update a role's `name`, `description` or `data`.

```json
{ "description": "Can moderate content and users", "data": { "permissions": ["read", "moderate", "delete"] } }
```

### `DELETE /api/roles/:id`

Delete a role. Fails if any user is still assigned to it.

### `GET /api/roles/users/:userId`

Get the roles assigned to a user.

### `PATCH /api/roles/users/:userId`

Replace the roles assigned to a user.

```json
{ "roleIds": ["<role-uuid-1>", "<role-uuid-2>"] }
```

### `DELETE /api/roles/users/:userId/:roleId`

Remove a specific role from a user.

## Health

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "...", "db": "up" }
```