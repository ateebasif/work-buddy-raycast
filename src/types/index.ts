export type CreateChat = {
  model: string;
  chatName: string;
};

export type ChatMessage = { id: string; role: string; content: string; timestamp: number };

export type StepView = "chatList" | "modelSelection" | "chatView";

export type CurrentView = "chatList" | "createChat" | "chatView";
