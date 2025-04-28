import { JSONLinesLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import moment from "moment";
import { showToast, Toast } from "@raycast/api";

import { FileData } from "@/types/index.js";

import { JsonDocumentLoader } from "./CustomDocumentLoaders.js";

type FileLoadError = {
  fileName: string;
  filePath: string;
  error: string;
};

export class FilesLoaderService {
  async loadFiles(fileDataArray: FileData[]): Promise<Document[]> {
    const enrichedDocs: Document[] = [];
    const errors: FileLoadError[] = [];

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
          errors.push({
            fileName,
            filePath,
            error: `Unsupported file type for file: ${filePath}`,
          });
          continue; // Skip unsupported file types
      }

      // Load the document and handle errors
      try {
        const docs = await loader.load();
        // Enrich the loaded documents with metadata
        const enriched = docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            fileName: fileData.fileName,
            createdAt: moment().valueOf(),
          },
        }));
        enrichedDocs.push(...enriched);
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      } catch (error: any) {
        console.error(`Error loading file ${filePath}:`, error);
        const errorObject = {
          fileName,
          filePath,
          error: `Error loading file ${fileName}: ${error.message}`,
        };
        errors.push(errorObject);
      }
    }

    // Log any errors encountered during loading
    if (errors.length > 0) {
      console.warn("Errors encountered during file loading:", errors);

      const errorFiles = errors.map((error) => error.fileName).join(", ");
      const errorMessages = errors.map((error) => `- ${error.error}`).join("\n");

      showToast({
        style: Toast.Style.Failure,
        title: `Error Loading File(s)  ${errorFiles}`,
        message: errorMessages,
      });
    }

    return enrichedDocs;
  }
}
