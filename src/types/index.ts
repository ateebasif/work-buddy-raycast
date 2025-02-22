export type CreateChat = {
  model: string;
  chatName: string;
};

export type ChatMessage = { id: string; role: string; content: string; timestamp: number };

export type CurrentView = "chatList" | "createChat" | "chatView" | "composeMessage" | "viewResponse";
