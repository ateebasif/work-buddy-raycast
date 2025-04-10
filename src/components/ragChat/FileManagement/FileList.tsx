import { useEffect, useState } from "react";
import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";

import { FileManagementService } from "@/lib/services/FileManagementService";
import useUnifiedChatStore from "@/store/unifiedChatStore";
import { CurrentView, FileData } from "@/types/index";
import { FilesLoaderService } from "@/lib/services/FileLoaderService";

const fileService = new FileManagementService(); // Initialize the file management service
const filesLoaderService = new FilesLoaderService();

const FileList = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]); // Local state for files
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);
  const loadRagDocs = useUnifiedChatStore((state) => state.loadRagDocs);

  // console.log("uploadedFiles", uploadedFiles);

  // Function to fetch the files
  const fetchFiles = () => {
    const files = fileService.listFiles();
    setUploadedFiles(files);
  };

  // Fetch files on component mount or after a file is deleted
  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file deletion
  const handleDeleteFile = (filePath: string) => {
    try {
      // Delete the file from the service
      fileService.deleteFile(filePath);

      // Remove the file from the local state
      setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.filePath !== filePath));

      // Show success toast
      showToast({
        style: Toast.Style.Success,
        title: "File Deleted",
        message: "The file was deleted successfully.",
      });
    } catch (error) {
      // Handle deletion error
      console.error("Error deleting file:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Error Deleting File",
        message: "An error occurred while deleting the file.",
      });
    }
  };

  const onUploadFile = async (file: FileData) => {
    // console.log("upload file clicked", file);

    await filesLoaderService.loadFiles([file]);

    // fileService.updateFileStatus(filePath, true);
    // fetchFiles();
  };

  const loadFilesInMemory = async () => {
    await loadRagDocs();
  };

  return (
    <List
      navigationTitle="Manage Files"
      searchBarPlaceholder="Select a file"
      isLoading={false}
      searchBarAccessory={<SearchBarAccessory />}
    >
      {uploadedFiles.length === 0 ? (
        <List.Item
          title="No files uploaded"
          detail={<List.Item.Detail markdown={`**Detailssss`} />}
          actions={
            <ActionPanel>
              <Action title="Add Files" onAction={() => setCurrentView("addFile")} />
            </ActionPanel>
          }
        />
      ) : (
        <>
          {uploadedFiles.map((file, index) => (
            <List.Item
              key={file.filePath + index}
              id={file.filePath} // Set unique id for each file
              title={file.fileName}
              subtitle={file.isUploaded ? "Uploaded" : "Not Uploaded"}
              detail={<List.Item.Detail markdown={`**Detailssss`} />}
              actions={
                <ActionPanel>
                  {/* <Action title="Upload File" onAction={() => onUploadFile(file.filePath)} /> */}
                  <Action title="Upload File" onAction={() => onUploadFile(file)} />
                  <Action title="Delete File" onAction={() => handleDeleteFile(file.filePath)} />
                  <Action title="Load Files in Memory" onAction={loadFilesInMemory} />
                  <Action title="Chat List" onAction={() => setCurrentView("chatList")} />
                </ActionPanel>
              }
            />
          ))}
        </>
      )}
    </List>
  );
};

export default FileList;

const SearchBarAccessory = () => {
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);

  // Function to handle the dropdown change and set the view
  const onViewChange = (newView: string) => {
    setCurrentView(newView as CurrentView); // Update the view based on the selected option
  };

  return (
    <List.Dropdown tooltip="Switch View" onChange={onViewChange}>
      <List.Dropdown.Item title="File List" value="fileList" />
      <List.Dropdown.Item title="Add New Files" value="addFile" />
    </List.Dropdown>
  );
};
