-- Enable pgvector extension for vector similarity search
-- This must be the first migration to ensure vector type is available
-- Reference: https://www.prisma.io/docs/postgres/database/postgres-extensions
CREATE EXTENSION IF NOT EXISTS vector;
