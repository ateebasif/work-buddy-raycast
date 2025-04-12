import { PoolConfig } from "pg";
import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";

export const MODELS = ["mistral:latest", "codegemma:7b", "deepseek-r1:1.5b", "llama3.2:latest"];

export const PGVECTOR_CONFIG = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "127.0.0.1",
    port: 5431,
    user: "myuser",
    password: "ChangeMe",
    database: "api",
  } as PoolConfig,
  tableName: "documents",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  // supported distance strategies: cosine (default), innerProduct, or euclidean
  distanceStrategy: "cosine" as DistanceStrategy,
};
