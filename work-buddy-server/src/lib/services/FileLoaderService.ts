import { JSONLinesLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";

import { JsonDocumentLoader } from "@/lib/services/CustomDocumentLoaders";

// For Multer file upload data type
type FileLoadError = {
  fileName: string;
  filePath: string;
  error: string;
};

type FileData = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer; // File buffer for uploaded files
  size: number;
  filePath: string;
};

export class FilesLoaderService {
  protected fileLoadError: FileLoadError[] = [];

  async loadFiles(fileDataArray: FileData[]): Promise<Document[]> {
    const enrichedDocs: Document[] = [];

    for (const fileData of fileDataArray) {
      const { buffer, originalname: fileName } = fileData;
      let loader;

      // Convert the Buffer to Blob (for compatibility with loaders)
      const fileBlob = new Blob([buffer]);

      // Determine the appropriate loader based on the file extension
      const fileExtension = fileName.split(".").pop()?.toLowerCase();
      switch (fileExtension) {
        case "json":
          loader = new JsonDocumentLoader(fileBlob); // Pass the Blob
          break;
        case "jsonl":
          loader = new JSONLinesLoader(fileBlob, "/html"); // This might also need adaptation for buffers
          break;
        case "txt":
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
        case "md":
          loader = new TextLoader(fileBlob); // Adapted to accept Blob
          break;
        case "csv":
          loader = new CSVLoader(fileBlob); // Adapted to accept Blob
          break;
        case "docx":
          loader = new DocxLoader(fileBlob); // Adapted to accept Blob
          break;
        case "pptx":
          loader = new PPTXLoader(fileBlob); // Adapted to accept Blob
          break;
        case "pdf":
          loader = new PDFLoader(fileBlob); // Adapted to accept Blob
          break;
        default:
          this.fileLoadError.push({
            fileName,
            filePath: "buffer", // Indicate source as buffer
            error: `Unsupported file type for file: ${fileName}`,
          });
          continue;
      }

      try {
        const docs = await loader.load(); // Load documents from the buffer (as Blob)
        const enriched = docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            fileName: fileData.originalname, // Store original file name
            createdAt: moment().valueOf(),
            source: fileData.filePath,
          },
          id: uuidv4(),
        }));
        enrichedDocs.push(...enriched);
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      } catch (error: any) {
        console.error(`Error loading file ${fileName}:`, error);
        this.fileLoadError.push({
          fileName,
          filePath: "buffer",
          error: `Error loading file ${fileName}: ${error.message}`,
        });
      }
    }

    return enrichedDocs;
  }
}
