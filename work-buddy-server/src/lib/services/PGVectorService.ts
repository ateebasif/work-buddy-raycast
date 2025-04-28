import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { OLLAMA_BASE_URL, PGVECTOR_CONFIG } from "@/constants";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: OLLAMA_BASE_URL,
});

export class PGVectorService {
  private vectorStore: PGVectorStore;
  private pool: Pool; // Use Pool for connection pooling

  constructor() {
    this.pool = new Pool(PGVECTOR_CONFIG.postgresConnectionOptions); // Initialize the pool
    this.vectorStore = new PGVectorStore(embeddings, PGVECTOR_CONFIG);
  }

  // Replaced the client connect and disconnect with pooling
  async connect() {
    // Pool handles connections automatically, no need for manual connect in each request.
    const client = await this.pool.connect(); // Get a client from the pool
    return client; // Return the client for queries
  }

  // Disconnect the pool at server shutdown (Optional, only if you want to explicitly close connections)
  async disconnect() {
    await this.pool.end();
    console.log("Disconnected from PostgreSQL database.");
  }

  async createTable() {
    const client = await this.connect(); // Use the pooled connection client
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id bigserial PRIMARY KEY,
        vector vector(768),  -- Adjust the dimension as needed
        content text,
        metadata jsonb
      );
    `);
    console.log("Table created successfully.");
    client.release(); // Release the client back to the pool
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
    const client = await this.connect();
    await client.query(`DELETE FROM documents WHERE id = $1`, [id]);
    console.log(`Document with ID ${id} deleted successfully.`);
    client.release();
  }

  async dropTable() {
    const client = await this.connect();
    await client.query(`DROP TABLE IF EXISTS documents;`);
    console.log("Table dropped successfully.");
    client.release();
  }

  async listDocuments() {
    const client = await this.connect();
    const res = await client.query(`SELECT * FROM documents;`);
    client.release();
    return res.rows;
  }

  async deleteDocumentsByMetadata(fileName: string, source: string) {
    try {
      const client = await this.connect();
      const query = `
        DELETE FROM documents 
        WHERE metadata->>'fileName' = $1 OR metadata->>'source' = $2
      `;
      const values = [fileName, source];
      const result = await client.query(query, values);
      console.log(
        `Deleted ${result.rowCount} document(s) with fileName: ${fileName} or source: ${source}.`
      );
      client.release();
      return { success: true, deletedCount: result.rowCount, error: null };
    } catch (err) {
      console.log("Error deleting documents by metadata:", err);
      return { success: false, deletedCount: 0, error: err };
    }
  }

  async insertVectorDocuments(documents: Document[]) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
    });
    const splitDocs = await splitter.splitDocuments(documents);
    await this.vectorStore.addDocuments(splitDocs);
  }
}
