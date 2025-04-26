export type CreateChat = {
  model: string;
  chatName: string;
};

export type ChatMessage = { id: string; role: string; content: string; timestamp: number };

export type CurrentView =
  | "chatList"
  | "createChat"
  | "chatView"
  | "composeMessage"
  | "viewResponse"
  | "fileManagement"
  | "fileList"
  | "addFile";

export type FileData = {
  fileName: string;
  filePath: string;
  isUploaded: boolean;
  createdAt: number;
};
