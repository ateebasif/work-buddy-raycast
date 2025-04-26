export type ChatHistory = {
  role: string;
  content: string;
  timestamp: number;
};

// Define the types for incoming requests
export type StreamRequestBody = {
  model: string;
  chatName: string;
  query: string;
  chatHistory: Array<ChatHistory>;
};

type Error = null | { message: string } | unknown;

type SuccessResponse<T> = {
  success: boolean;
  error: Error;
  data: T;
};

type ErrorResponse = {
  success: boolean;
  error: Error;
  data: null;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export type FileData = {
  fileName: string;
  filePath: string;
  isUploaded: boolean;
  createdAt: number;
};
