import fs from "fs";
import path from "path";
import { FileData } from "@/types/index";

export class FileManagementService {
  protected FILE_DIR: string;
  protected FILES_JSON: string;

  constructor() {
    // Path to store file management records
    this.FILE_DIR = path.join(__dirname, "files");
    if (!fs.existsSync(this.FILE_DIR)) fs.mkdirSync(this.FILE_DIR); // Create directory if it doesn't exist

    this.FILES_JSON = path.join(this.FILE_DIR, "file_records.json"); // Path to the JSON file where records will be stored
  }

  // Method to get the file records from JSON
  private getFileRecords(): FileData[] {
    if (!fs.existsSync(this.FILES_JSON)) {
      return []; // If no file exists, return an empty array
    }

    const fileContent = fs.readFileSync(this.FILES_JSON, "utf-8");
    return JSON.parse(fileContent) as FileData[];
  }

  // Method to save the file records to JSON
  private saveFileRecords(records: FileData[]): void {
    fs.writeFileSync(this.FILES_JSON, JSON.stringify(records, null, 2), "utf-8");
  }

  // Method to add new files to the file records
  public addFiles(files: FileData[]): void {
    const fileRecords = this.getFileRecords();

    // Ensure no duplicates based on filePath
    const updatedRecords = [
      ...fileRecords.filter((record) => !files.some((newFile) => newFile.filePath === record.filePath)),
      ...files, // Add the new files
    ];

    // Save the updated records back to the JSON file
    this.saveFileRecords(updatedRecords);
    console.log("Files added successfully.", updatedRecords);
  }

  // Method to update the file status (e.g., after upload)
  public updateFileStatus(filePath: string, status: boolean): void {
    const fileRecords = this.getFileRecords();

    // Find the file record by filePath and update the isUploaded status
    const updatedRecords = fileRecords.map((file) =>
      file.filePath === filePath ? { ...file, isUploaded: status } : file,
    );

    // Save the updated records back to the JSON file
    this.saveFileRecords(updatedRecords);
    console.log(`File ${filePath} upload status updated to ${status ? "uploaded" : "not uploaded"}.`);
  }

  // Method to delete a file record from the JSON file
  public deleteFile(filePath: string): void {
    let fileRecords = this.getFileRecords();

    // Remove the file from the records by filtering out the file with the given filePath
    fileRecords = fileRecords.filter((file) => file.filePath !== filePath);

    // Save the updated records back to the JSON file
    this.saveFileRecords(fileRecords);
    console.log(`File ${filePath} deleted from records.`);
  }

  // Method to fetch all file records
  public listFiles(): FileData[] {
    return this.getFileRecords();
  }
}
