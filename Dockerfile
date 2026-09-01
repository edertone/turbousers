# ---------- Single-stage image ----------
# The service runs TypeScript directly via ts-node — no build step, no dist output.
# It is designed to run exclusively inside a container.
FROM node:20-alpine

WORKDIR /usr/src/app

# Prisma engine requires OpenSSL at runtime on alpine
RUN apk add --no-cache openssl libc6-compat

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including devDependencies: typescript, @types/*,
# and ts-node are required to run TypeScript directly at runtime).
# Force a full install regardless of NODE_ENV.
RUN NODE_ENV=development npm install && npm cache clean --force

# Copy Prisma schema first for client generation
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source
COPY . .

# Runtime environment is production
ENV NODE_ENV=production

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/src/app/docker-entrypoint.sh"]