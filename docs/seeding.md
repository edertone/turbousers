# Seeding

On container startup the service ensures an initial **admin** exists, and optionally seeds 5 demo users:

| Email                  | Role  | Password  |
| ---------------------- | ----- | --------- |
| `admin@usersvc.local`  | ADMIN | `admin123` |
| `demo1@usersvc.local`  | USER  | `demo123`  |
| `demo2@usersvc.local`  | USER  | `demo123`  |
| `demo3@usersvc.local`  | USER  | `demo123`  |
| `demo4@usersvc.local`  | USER  | `demo123`  |
| `demo5@usersvc.local`  | USER  | `demo123`  |

Seeding is **idempotent** — existing users are never duplicated. Control it with the `SEED_ADMIN_*` and `SEED_DEMO_USERS` variables (see [Configuration](configuration.md)).