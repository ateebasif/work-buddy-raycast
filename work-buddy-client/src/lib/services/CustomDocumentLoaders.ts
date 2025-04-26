import { loadJsonFile } from "load-json-file";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";

export class JsonDocumentLoader extends BaseDocumentLoader {
  private filePath: string;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  async load(): Promise<Document[]> {
    try {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const jsonData = await loadJsonFile<Record<string, any>[]>(this.filePath);

      if (Array.isArray(jsonData)) {
        // Case: JSON is an array
        return jsonData.map((item) => ({
          pageContent: JSON.stringify(item),
          metadata: { source: this.filePath },
        }));
      } else if (typeof jsonData === "object" && jsonData !== null) {
        // Case: JSON is a single object
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
