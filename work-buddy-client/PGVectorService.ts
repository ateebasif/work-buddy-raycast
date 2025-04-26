import { PGVectorStore, DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { PoolConfig, Client } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";

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

const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });

class PGVectorService {
  private vectorStore: PGVectorStore;
  private client: Client;

  constructor() {
    this.client = new Client(config.postgresConnectionOptions);
    this.vectorStore = new PGVectorStore(embeddings, config);
  }

  async connect() {
    await this.client.connect();
    console.log("Connected to PostgreSQL database.");
  }

  async disconnect() {
    await this.client.end();
    console.log("Disconnected from PostgreSQL database.");
  }

  async createTable() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id bigserial PRIMARY KEY,
        vector vector(768),  -- Adjust the dimension as needed
        content text,
        metadata jsonb
      );
    `);
    console.log("Table created successfully.");
  }

  async insertDocuments(documents: Document[]) {
    const ids = documents.map(() => uuidv4());
    await this.vectorStore.addDocuments(documents, { ids });
    console.log("Documents inserted successfully.");
  }

  async similaritySearch(query: string, limit: number) {
    const results = await this.vectorStore.similaritySearch(query, limit);
    return results;
  }

  async deleteDocumentById(id: string) {
    await this.client.query(`DELETE FROM documents WHERE id = $1`, [id]);
    console.log(`Document with ID ${id} deleted successfully.`);
  }

  async dropTable() {
    await this.client.query(`DROP TABLE IF EXISTS documents;`);
    console.log("Table dropped successfully.");
  }

  async listDocuments() {
    const res = await this.client.query(`SELECT * FROM documents;`);
    return res.rows; // Return the rows from the query result
  }

  async deleteDocumentsByMetadata(fileName: string, source: string) {
    const query = `
      DELETE FROM documents 
      WHERE metadata->>'fileName' = $1 OR metadata->>'source' = $2
    `;
    const values = [fileName, source];
    const result = await this.client.query(query, values);
    console.log(`Deleted ${result.rowCount} document(s) with fileName: ${fileName} or source: ${source}.`);
  }
}

// Example usage
const runPG = async () => {
  const pgService = new PGVectorService();

  try {
    await pgService.connect();
    // Example of dropping the table
    // await pgService.dropTable();

    // await pgService.createTable();

    // Example of deleting documents by metadata
    // await pgService.deleteDocumentsByMetadata("Ateeb Resumes Updates.docx", "https://example.com");
    // return;

    // List all documents
    const allDocuments = await pgService.listDocuments();
    console.log("All documents in the database:");
    allDocuments.forEach((doc) => {
      console.log(`ID: ${doc.id}, Content:, Metadata: ${JSON.stringify(doc.metadata)}`);
    });

    // await pgService.createTable();

    // const documents: Document[] = [
    //   {
    //     pageContent: "The powerhouse of the cell is the mitochondria",
    //     metadata: { source: "https://example.com" },
    //   },
    //   {
    //     pageContent: "Buildings are made out of brick",
    //     metadata: { source: "https://example.com" },
    //   },
    //   {
    //     pageContent: "Mitochondria are made out of lipids",
    //     metadata: { source: "https://example.com" },
    //   },
    //   {
    //     pageContent: "The 2024 Olympics are in Paris",
    //     metadata: { source: "https://example.com" },
    //   },
    // ];

    // await pgService.insertDocuments(documents);

    // const similarityResults = await pgService.similaritySearch("Olympics", 1);
    // for (const doc of similarityResults) {
    //   console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null, 2)}]`);
    // }

    // Example of deleting a document by ID (replace with actual ID)
    // await pgService.deleteDocumentById("some-id");

    // Example of dropping the table
    // await pgService.dropTable();
  } catch (err) {
    console.error("Error in PGVectorService:", err);
  } finally {
    await pgService.disconnect();
  }
};

runPG();
