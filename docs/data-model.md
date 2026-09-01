# Data model

Four tables:

- **`users`** — `id` (UUID), `email` (unique), `passwordHash`, `firstName`, `lastName`, `phone`, `data` (arbitrary JSON), `status` (`ACTIVE`/`INACTIVE`), `emailVerified`, `lastLoginAt`, `createdAt`, `updatedAt`.
- **`roles`** — `id` (UUID), `name` (unique), `description`, `data` (arbitrary JSON), `createdAt`, `updatedAt`.
- **`user_roles`** — join table (`userId`, `roleId`) mapping users to roles (many-to-many), with cascade deletes.
- **`refresh_tokens`** — hashed refresh tokens with `expiresAt` and `revokedAt` (supporting rotation), foreign keyed to `users` with cascade delete.

## Password rules

Passwords must be at least **8 characters** and contain at least one lowercase letter, one uppercase letter, and one **digit**.