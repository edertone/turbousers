#!/bin/sh
set -e

echo "Waiting for database to be ready..."
attempt=0
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Database did not become ready after $attempt attempts. Exiting."
    exit 1
  fi
  echo "Database not ready yet (attempt $attempt), retrying in 3s..."
  sleep 3
done

echo "Generating Prisma client..."
npx prisma generate

echo "Running seed..."
npm run seed

echo "Starting application..."
npm start
