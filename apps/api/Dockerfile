# ============================================================================
# Curio API Dockerfile
# Multi-stage build for production deployment to Cloud Run
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Builder
# ----------------------------------------------------------------------------
FROM node:24-slim AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy package.json files for dependency resolution
COPY packages/database/package.json ./packages/database/
COPY api/package.json ./api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/database ./packages/database
COPY api ./api

# Generate Prisma client and build database package
WORKDIR /app/packages/database
RUN pnpm db:generate && pnpm build

# Build API
WORKDIR /app/api
RUN pnpm build

# ----------------------------------------------------------------------------
# Stage 2: Runner (Production)
# ----------------------------------------------------------------------------
FROM node:24-slim AS runner

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy package.json files
COPY packages/database/package.json ./packages/database/
COPY api/package.json ./api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder stage
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/api/dist ./api/dist

# Cloud Run uses PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Run the API server
CMD ["node", "api/dist/index.js"]
