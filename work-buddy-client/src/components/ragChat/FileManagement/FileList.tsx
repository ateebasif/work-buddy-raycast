import { useEffect, useState } from "react";
import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import fs from "fs";

import axios from "@/lib/utils/axios";
import { FileManagementService } from "@/lib/services/FileManagementService";
import useUnifiedChatStore from "@/store/unifiedChatStore";
import { CurrentView, FileData } from "@/types/index";

// / Initialize the Services
const fileService = new FileManagementService();

const FileList = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]); // Local state for files
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);

  const [isUploading, setisUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to fetch the files
  const fetchFiles = () => {
    const files = fileService.listFiles();
    setUploadedFiles(files);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file deletion

  const handleDeleteFile = async (filePath: string) => {
    try {
      setIsDeleting(true);

      const fileDelete = await axios.post("/documents/delete", { filePath });

      if (fileDelete.data.success) {
        // const fileDelete = await pgVectorService.deleteDocumentsByMetadata("", filePath);
        console.log("fileDelete Res", fileDelete.data);
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
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Error Deleting File",
          message: "An error occurred while deleting the file.",
        });
      }
    } catch (error) {
      // Handle deletion error
      console.error("Error deleting file:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Error Deleting File",
        message: "An error occurred while deleting the file.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadFile = async (fileData: FileData) => {
    if (isUploading) return;

    if (fileData.isUploaded) {
      showToast({
        style: Toast.Style.Success,
        title: "File Already Uploaded.",
        message: `The file ${fileData.fileName} is Already uploaded!`,
      });

      return;
    }

    try {
      setisUploading(true);
      // console.log("fileData", fileData);
      const { filePath, fileName } = fileData;

      // Read the file from the filesystem
      const fileBuffer = fs.readFileSync(filePath);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), fileName); // 'file' is the name of the field on the server

      formData.append("filePath", filePath);

      console.log("formData", formData);

      // Send the file to the server using axios
      const response = await axios.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Important for file upload
        },
      });

      console.log("File upload response:", response.data);

      if (response.data.success) {
        fileService.updateFileStatus(fileData.filePath, true);
        fetchFiles();

        showToast({
          style: Toast.Style.Success,
          title: "File Uploaded",
          message: `The file ${fileName} was uploaded successfully.`,
        });
      }
    } catch (error) {
      console.log("error in uploadiing file", error);

      showToast({
        style: Toast.Style.Failure,
        title: "Error Uploading File.",
        message: `Something went wrong!`,
      });
    } finally {
      setisUploading(false);
    }
  };

  return (
    <List
      navigationTitle="Manage Files"
      searchBarPlaceholder="Select a file"
      isLoading={isUploading || isDeleting}
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
                  <Action title="Delete File" onAction={() => handleDeleteFile(file.filePath)} />
                  <Action title="Upload File" onAction={() => handleUploadFile(file)} />
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
      <List.Dropdown.Item title="Chat List" value="chatList" />
    </List.Dropdown>
  );
};
