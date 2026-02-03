# ============================================================================
# Curio Article Fetch Job Dockerfile
# Cloud Run Jobs for fetching article content
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
COPY jobs/package.json ./jobs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/database ./packages/database
COPY jobs ./jobs

# Generate Prisma client and build
WORKDIR /app/packages/database
RUN pnpm db:generate && pnpm build

WORKDIR /app/jobs
RUN pnpm build

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
COPY jobs/package.json ./jobs/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/jobs/dist ./jobs/dist

# Run article fetch job
CMD ["node", "jobs/dist/article-fetch/index.js"]
