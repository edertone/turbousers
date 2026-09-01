#!/bin/sh
set -e

echo "Waiting for database to be ready..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Running seed..."
node dist/prisma/seed.js

echo "Starting application..."
node dist/main
