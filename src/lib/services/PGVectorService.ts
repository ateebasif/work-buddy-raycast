import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Client } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";
import { OllamaEmbeddings } from "@langchain/ollama";

import { PGVECTOR_CONFIG } from "@/lib/constants";

const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });

export class PGVectorService {
  private vectorStore: PGVectorStore;
  private client: Client;
  private isConnected: boolean = false; // Flag to track connection status

  constructor() {
    this.client = new Client(PGVECTOR_CONFIG.postgresConnectionOptions);
    this.vectorStore = new PGVectorStore(embeddings, PGVECTOR_CONFIG);
  }

  async connectt() {
    try {
      await this.client.connect();
      console.log("Connected to PostgreSQL database.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error connecting to PostgreSQL:", err);
      return { success: false, error: err };
    }
  }

  async disconnectt() {
    try {
      await this.client.end();
      console.log("Disconnected from PostgreSQL database.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error disconnecting from PostgreSQL:", err);
      return { success: false, error: err };
    }
  }

  async connect() {
    if (this.isConnected) {
      console.log("Client is already connected.");
      return { success: true, error: null };
    }
    try {
      await this.client.connect();
      this.isConnected = true; // Set the flag to true
      console.log("Connected to PostgreSQL database.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error connecting to PostgreSQL:", err);
      return { success: false, error: err };
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      console.log("Client is not connected.");
      return { success: true, error: null };
    }
    try {
      await this.client.end();
      this.isConnected = false; // Reset the flag
      console.log("Disconnected from PostgreSQL database.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error disconnecting from PostgreSQL:", err);
      return { success: false, error: err };
    }
  }

  // New method to check connection status
  isClientConnected() {
    return this.isConnected;
  }

  async createTable() {
    try {
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id bigserial PRIMARY KEY,
          vector vector(768),  -- Adjust the dimension as needed
          content text,
          metadata jsonb
        );
      `);
      console.log("Table created successfully.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error creating table:", err);
      return { success: false, error: err };
    }
  }

  async insertDocuments(documents: Document[]) {
    try {
      const ids = documents.map(() => uuidv4());
      await this.vectorStore.addDocuments(documents, { ids });
      console.log("Documents inserted successfully.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error inserting documents:", err);
      return { success: false, error: err };
    }
  }

  async similaritySearch(query: string, limit: number) {
    try {
      const results = await this.vectorStore.similaritySearch(query, limit);
      return { success: true, results, error: null };
    } catch (err) {
      console.log("Error during similarity search:", err);
      return { success: false, results: null, error: err };
    }
  }

  async deleteDocumentById(id: string) {
    try {
      await this.client.query(`DELETE FROM documents WHERE id = $1`, [id]);
      console.log(`Document with ID ${id} deleted successfully.`);
      return { success: true, error: null };
    } catch (err) {
      console.log("Error deleting document:", err);
      return { success: false, error: err };
    }
  }

  async dropTable() {
    try {
      await this.client.query(`DROP TABLE IF EXISTS documents;`);
      console.log("Table dropped successfully.");
      return { success: true, error: null };
    } catch (err) {
      console.log("Error dropping table:", err);
      return { success: false, error: err };
    }
  }

  async listDocuments() {
    try {
      const res = await this.client.query(`SELECT * FROM documents;`);
      return { success: true, documents: res.rows, error: null };
    } catch (err) {
      console.log("Error listing documents:", err);
      return { success: false, documents: null, error: err };
    }
  }

  async deleteDocumentsByMetadata(fileName: string, source: string) {
    try {
      const query = `
        DELETE FROM documents 
        WHERE metadata->>'fileName' = $1 OR metadata->>'source' = $2
      `;
      const values = [fileName, source];
      const result = await this.client.query(query, values);
      console.log(`Deleted ${result.rowCount} document(s) with fileName: ${fileName} or source: ${source}.`);
      return { success: true, deletedCount: result.rowCount, error: null };
    } catch (err) {
      console.log("Error deleting documents by metadata:", err);
      return { success: false, deletedCount: 0, error: err };
    }
  }
}
