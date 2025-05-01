# Work Buddy

Talks with AI

This client-side component of the Work Buddy Raycast extension handles the user interface and interaction with the backend server for both the "Talk" and "RAG Talk" functionalities.

## Scripts

The following scripts are available in the `package.json` file:

- `dev`: Runs the Raycast extension in development mode.
- `build`: Builds the Raycast extension for production.
- `lint`: Lints the TypeScript code.
- `pgVector`: Executes the `PGVectorService.ts` script, which provides direct interaction with the PostgreSQL database used for the "RAG Talk" feature.

## PGVectorService

The `PGVectorService.ts` file located in this directory provides a utility to directly interact with the PostgreSQL database that stores the document embeddings for the "RAG Talk" functionality. This service allows you to perform operations such as:

- Connecting to and disconnecting from the PostgreSQL database.
- Creating and dropping the `documents` table.
- Inserting new documents and their embeddings.
- Performing similarity searches on the document embeddings.
- Deleting documents by their unique ID or based on metadata (e.g., `fileName`, `source`).
- Listing all documents in the database.

This script utilizes the `@langchain/community/vectorstores/pgvector` library to manage the vector store and `@langchain/ollama` for generating embeddings using the `nomic-embed-text` model.

**Note:** This script is primarily intended for development and maintenance tasks, allowing direct database manipulation if needed.

**How to use the `pgVector` script:**

1.  Navigate to the `work-buddy-client` directory in your terminal.
2.  Run the script using the following command:
    ```bash
    npm run pgVector
    ```
3.  Modify the `runPG` function within `PGVectorService.ts` to perform the specific database operations you need (e.g., listing documents, deleting by metadata, dropping the table). Remember to comment out or adjust the example usage as required.
4.  The **output of the script will be displayed in your terminal.**

**Configuration:**

The database connection details (host, port, user, password, database name) and table configuration are defined within the `PGVectorService.ts` file. **It is crucial to ensure these settings precisely match the database configuration in your `work-buddy-server`'s Docker Compose setup to avoid connection errors.**

```typescript
// Sample config
const config = {
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
  distanceStrategy: "cosine" as DistanceStrategy,
};
```
