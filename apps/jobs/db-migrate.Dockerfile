# ============================================================================
# Curio DB Migration Job Dockerfile
# Cloud Run Jobs for running Prisma migrations
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Builder
# ----------------------------------------------------------------------------
FROM node:24-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/database/package.json ./packages/database/

# Install dependencies (need devDependencies for prisma CLI)
RUN pnpm install --frozen-lockfile

# Copy database package
COPY packages/database ./packages/database

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm db:generate

# ----------------------------------------------------------------------------
# Stage 2: Runner
# ----------------------------------------------------------------------------
FROM node:24-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/database/package.json ./packages/database/

# Install all dependencies (prisma CLI is in devDependencies)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and migrations
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma

WORKDIR /app/packages/database

# Run database migration
CMD ["pnpm", "db:migrate:deploy"]
