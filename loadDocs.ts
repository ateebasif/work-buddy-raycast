import fs from "fs";
import path from "path";
import moment from "moment";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";
import { JSONLinesLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PGVectorStore, DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { OllamaEmbeddings } from "@langchain/ollama";
import { PoolConfig } from "pg";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FileData } from "./src/types/index"; // Adjust the import path as necessary

// Type for file load errors
type FileLoadError = {
  fileName: string;
  filePath: string;
  error: string;
};

// Class to load JSON documents
class JsonDocumentLoader extends BaseDocumentLoader {
  private filePath: string;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  async load(): Promise<Document[]> {
    try {
      // Read the JSON file using fs.promises.readFile
      const fileContent = await fs.promises.readFile(this.filePath, "utf-8");
      const jsonData = JSON.parse(fileContent); // Parse the JSON data

      if (Array.isArray(jsonData)) {
        return jsonData.map((item) => ({
          pageContent: JSON.stringify(item),
          metadata: { source: this.filePath },
        }));
      } else if (typeof jsonData === "object" && jsonData !== null) {
        return [
          {
            pageContent: JSON.stringify(jsonData),
            metadata: { source: this.filePath },
          },
        ];
      } else {
        throw new Error("Invalid JSON format: Must be an object or an array of objects.");
      }
    } catch (error) {
      console.error(`Error loading JSON file: ${this.filePath}`, error);
      throw error;
    }
  }
}

// Configuration for PostgreSQL connection
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

// Main service class for document processing
class DocService {
  protected FILE_DIR: string;
  protected FILES_JSON: string;
  private vectorStore: PGVectorStore;
  protected fileLoadError: FileLoadError[] = [];

  constructor() {
    const extensionPath = "/Users/ateebasif/.config/raycast/extensions/work-buddy"; // Update this path as needed
    this.FILE_DIR = path.join(extensionPath, "files");
    if (!fs.existsSync(this.FILE_DIR)) fs.mkdirSync(this.FILE_DIR);
    this.FILES_JSON = path.join(this.FILE_DIR, "file_records.json");
    this.vectorStore = new PGVectorStore(new OllamaEmbeddings({ model: "nomic-embed-text" }), config);
  }

  private getFileRecords(): FileData[] {
    if (!fs.existsSync(this.FILES_JSON)) {
      return [];
    }
    const fileContent = fs.readFileSync(this.FILES_JSON, "utf-8");
    return JSON.parse(fileContent) as FileData[];
  }

  public listFiles(): FileData[] {
    return this.getFileRecords();
  }

  // Method to save the file records to JSON
  private saveFileRecords(records: FileData[]): void {
    fs.writeFileSync(this.FILES_JSON, JSON.stringify(records, null, 2), "utf-8");
  }

  // Method to update the file status (e.g., after upload)
  protected updateFileStatus(filePath: string, status: boolean): void {
    const fileRecords = this.getFileRecords();

    // Find the file record by filePath and update the isUploaded status
    const updatedRecords = fileRecords.map((file) =>
      file.filePath === filePath ? { ...file, isUploaded: status } : file,
    );

    // Save the updated records back to the JSON file
    this.saveFileRecords(updatedRecords);
    // console.log(`File ${filePath} upload status updated to ${status ? "uploaded" : "not uploaded"}.`);
  }

  async loadFiles(fileDataArray: FileData[]): Promise<Document[]> {
    const enrichedDocs: Document[] = [];

    for (const fileData of fileDataArray) {
      const { filePath, fileName } = fileData;
      let loader;

      // Determine the appropriate loader based on the file extension
      const fileExtension = filePath.split(".").pop()?.toLowerCase();
      switch (fileExtension) {
        case "json":
          loader = new JsonDocumentLoader(filePath);
          break;
        case "jsonl":
          loader = new JSONLinesLoader(filePath, "/html");
          break;
        case "txt":
          loader = new TextLoader(filePath);
          break;
        case "csv":
          loader = new CSVLoader(filePath);
          break;
        case "docx":
          loader = new DocxLoader(filePath);
          break;
        case "md":
          loader = new TextLoader(filePath);
          break;
        case "pptx":
          loader = new PPTXLoader(filePath);
          break;
        case "pdf":
          loader = new PDFLoader(filePath);
          break;
        default:
          this.fileLoadError.push({
            fileName,
            filePath,
            error: `Unsupported file type for file: ${filePath}`,
          });
          continue;
      }

      try {
        const docs = await loader.load();
        const enriched = docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            fileName: fileData.fileName,
            createdAt: moment().valueOf(),
          },
        }));
        enrichedDocs.push(...enriched);
      } catch (error: any) {
        // console.error(`Error loading file ${filePath}:`, error);
        this.fileLoadError.push({
          fileName,
          filePath,
          error: `Error loading file ${fileName}: ${error.message}`,
        });
      }
    }

    // if (this.fileLoadError.length > 0) {
    //   console.warn("Errors encountered during file loading:", this.fileLoadError);
    // }

    return enrichedDocs;
  }

  async createVectorStore(documents: Document[]) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
    });
    const splitDocs = await splitter.splitDocuments(documents);
    await this.vectorStore.addDocuments(splitDocs);
  }

  async loadDocsInDB() {
    const files = this.listFiles();
    // Filter files to only include those that have not been uploaded
    const filesToUpload = files.filter((file) => !file.isUploaded);
    const successfulFiles: FileData[] = []; // Array to track successfully loaded files

    // Check if there are any files to upload
    if (filesToUpload.length === 0) {
      console.log("📁 There are no files to upload or all files have already been uploaded.");
      return; // Exit the function early
    }

    console.log(`📂 Starting upload of ${files.length} files...`);

    for (const file of filesToUpload) {
      console.log("📄 reading file", file.fileName);

      const docs = await this.loadFiles([file]);

      if (docs.length > 0) {
        // Check if any documents were loaded successfully
        console.log("docs", docs);
        await this.createVectorStore(docs);
        console.log("✅ Uploaded file", file.fileName);

        successfulFiles.push(file); // Add to successful files
      } else {
        console.error(`❌ No documents loaded for file ${file.fileName}.`);
      }
    }

    // Update the status of only the successfully uploaded files
    for (const file of successfulFiles) {
      this.updateFileStatus(file.filePath, true);
    }

    if (this.fileLoadError.length > 0) {
      console.warn(`⚠️ Errors encountered during file loading: ${this.fileLoadError.length} errors.`);
      console.warn("Errors encountered during file loading:", this.fileLoadError);
    }

    console.log(`📊 Upload process completed. ${successfulFiles.length} files uploaded successfully.`);
  }
}

(async () => {
  const docService = new DocService();

  await docService.loadDocsInDB();
})();
