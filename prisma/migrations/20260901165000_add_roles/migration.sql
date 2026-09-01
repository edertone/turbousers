-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- Add a Json column to users for arbitrary data
ALTER TABLE "users" ADD COLUMN "data" JSONB;

-- Migrate existing enum-based roles into the new roles table.
-- Keep the legacy enum column around so existing data can be carried over,
-- then it is dropped below.
INSERT INTO "roles" ("id", "name", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign each existing user to the matching role by name.
INSERT INTO "user_roles" ("userId", "roleId", "createdAt")
SELECT u.id, r.id, CURRENT_TIMESTAMP
FROM "users" u
JOIN "roles" r ON r.name = u."role"::text;

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the legacy enum column and type.
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "Role";