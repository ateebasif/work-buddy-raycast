CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id bigserial PRIMARY KEY,                -- Auto-incrementing primary key
  vector vector(768),                      -- Vector column with 768 dimensions (adjust as needed)
  content text,                            -- Content column to store document text
  metadata jsonb                           -- Metadata column to store document-related JSON data
);
