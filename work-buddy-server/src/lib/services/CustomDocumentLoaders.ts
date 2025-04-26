import fs from "fs";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";

// Modify the constructor to accept either a file path, buffer, or blob
export class JsonDocumentLoader extends BaseDocumentLoader {
  private filePath?: string;
  private fileBuffer?: Buffer;
  private fileBlob?: Blob;

  // Allow the constructor to accept a file path (string), buffer, or blob
  constructor(filePathOrBufferOrBlob: string | Buffer | Blob) {
    super();
    if (Buffer.isBuffer(filePathOrBufferOrBlob)) {
      this.fileBuffer = filePathOrBufferOrBlob; // If it's a buffer, store it
    } else if (filePathOrBufferOrBlob instanceof Blob) {
      this.fileBlob = filePathOrBufferOrBlob; // If it's a Blob, store it
    } else {
      this.filePath = filePathOrBufferOrBlob; // If it's a file path, store it
    }
  }

  // Load method to handle file path, buffer, or blob
  async load(): Promise<Document[]> {
    try {
      let jsonData;

      if (this.fileBuffer) {
        // If it's a buffer, parse it directly
        jsonData = JSON.parse(this.fileBuffer.toString());
      } else if (this.fileBlob) {
        // If it's a Blob, read it as text and parse the JSON
        const blobText = await this.fileBlob.text();
        jsonData = JSON.parse(blobText);
      } else if (this.filePath) {
        // If it's a file path, use fs to read the file
        const fileContent = await fs.promises.readFile(this.filePath, "utf-8");
        jsonData = JSON.parse(fileContent);
      } else {
        throw new Error("No file path, buffer, or blob provided.");
      }

      // Process the JSON data
      if (Array.isArray(jsonData)) {
        // If the JSON is an array, map it to documents
        return jsonData.map((item) => ({
          pageContent: JSON.stringify(item),
          metadata: { source: this.filePath || "buffer" }, // Use "buffer" or "blob" if it's from buffer or blob
        }));
      } else if (typeof jsonData === "object" && jsonData !== null) {
        // If the JSON is a single object
        return [
          {
            pageContent: JSON.stringify(jsonData),
            metadata: { source: this.filePath || "buffer" },
          },
        ];
      } else {
        throw new Error(
          "Invalid JSON format: Must be an object or an array of objects."
        );
      }
    } catch (error) {
      console.error("Error loading JSON data", error);
      throw error;
    }
  }
}
