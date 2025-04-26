import { PoolConfig } from "pg";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import "dotenv/config";

export const MODELS = [
  "mistral:latest",
  "codegemma:7b",
  "deepseek-r1:1.5b",
  "llama3.2:latest",
];

const ollamaHost = process.env.OLLAMA_HOST || "localhost"; // Default to localhost if not set
const ollamaPort = process.env.OLLAMA_PORT || "11434"; // Default to 11434 if not set
// Construct the full base URL dynamically
export const OLLAMA_BASE_URL = `http://${ollamaHost}:${ollamaPort}`;

export const PGVECTOR_CONFIG = {
  postgresConnectionOptions: {
    type: "postgres",
    host: process.env.PG_HOST || "db", // ✅ Docker Compose service name
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || "myuser",
    password: process.env.PG_PASSWORD || "ChangeMe",
    database: process.env.PG_DATABASE || "api",
  } as PoolConfig,
  tableName: "documents",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine" as DistanceStrategy,
};
