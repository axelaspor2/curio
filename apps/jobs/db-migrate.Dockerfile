# ============================================================================
# Curio DB Migration Job Dockerfile
# Cloud Run Jobs for running Prisma migrations
# ============================================================================

FROM node:24-slim

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/database/package.json ./packages/database/

# Install dependencies (need devDependencies for prisma CLI)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema, migrations, and config
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/prisma.config.ts ./packages/database/

WORKDIR /app/packages/database

# Run database migration
CMD ["pnpm", "db:migrate:deploy"]
