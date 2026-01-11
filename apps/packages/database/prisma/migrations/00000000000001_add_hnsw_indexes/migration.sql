-- Add HNSW indexes for fast vector similarity search (Cosine distance)
-- HNSW is recommended for production: better query performance than IVFFlat
-- Reference: https://github.com/pgvector/pgvector#hnsw

-- Index for article embeddings (used in feed generation)
CREATE INDEX IF NOT EXISTS articles_embedding_idx
  ON articles USING hnsw (embedding vector_cosine_ops);

-- Index for user interest vectors (used in personalization)
CREATE INDEX IF NOT EXISTS user_interest_vectors_embedding_idx
  ON user_interest_vectors USING hnsw (interest_embedding vector_cosine_ops);
