import { ActionPanel, Form, Action, showToast, Toast } from "@raycast/api";
import fs from "fs";

import { FileManagementService } from "@/lib/services/FileManagementService";
import { FileData } from "@/types/index";

// Initialize the file management service
const fileService = new FileManagementService();

export function FileManagement() {
  const handleFileUpload = (values: { files: string[] }) => {
    const files = values.files
      .filter((filePath: string) => fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) // Check if the file exists
      .map((filePath: string): FileData => {
        const fileName = filePath.split("/").pop() || "Unknown"; // Extract file name
        return {
          fileName,
          filePath,
          isUploaded: false, // Initially, the file is not uploaded
          createdAt: Date.now(), // Set creation timestamp
        };
      });

    console.log("Files Array:", files); // Display the array of file objects in the console

    try {
      // Use the service to add the files to the JSON
      fileService.addFiles(files); // Pass the array of file objects to the service

      showToast({
        style: Toast.Style.Success,
        title: "Files Added",
        message: `${files.length} files have been added successfully!`,
      });
    } catch (error) {
      console.error("Error adding files:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Error Adding Files",
        message: "An error occurred while adding the files.",
      });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Files" onSubmit={handleFileUpload} />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="files" title="Select Files" info="Select one or more files to add to the chat." />
    </Form>
  );
}
