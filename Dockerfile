# ---------- Development stage ----------
FROM node:20-alpine AS development

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including dev deps for building)
RUN npm install

# Copy Prisma schema first for generate
COPY prisma ./prisma

# Copy rest of source
COPY . .

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Prisma engine requires OpenSSL at runtime on alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output
COPY --from=development /usr/src/app/dist ./dist

# Copy Prisma schema + migrations for runtime `migrate deploy`
COPY --from=development /usr/src/app/prisma ./prisma
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/src/app/docker-entrypoint.sh"]