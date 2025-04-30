import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import moment from "moment";
import { nanoid } from "nanoid";
import { showToast, Toast } from "@raycast/api";

import { ChatService } from "@/lib/services/ChatService";
import { DocumentChatService } from "@/lib/services/DocumentChatService";
import { CodeFixService, CUSTOM_PROMPTS } from "@/lib/services/CodeFixService";
import { ChatMessage, CreateChat, CurrentView } from "@/types/index";
import { generateChatName } from "@/lib/utils";

const chatServices = {
  chatService: new ChatService(),
  codeFixService: new CodeFixService(CUSTOM_PROMPTS),
  // ragChatService: new ChatService(),
  ragChatService: new DocumentChatService(),
};

interface ChatServiceState {
  [serviceName: string]: {
    messages: ChatMessage[];
    existingChats: string[];
    selectedChat: string | null;
    inputMessage: string;
    isLoading: boolean;
    name: string;
  };
}

type CurrentService = "chatService" | "codeFixService" | "ragChatService";

type ChatFunction = (
  model: string,
  chatName: string,
  inputMessage: string,
  onData: (chunk: string, timestamp: number) => void,
  onEnd: () => void,
) => Promise<void>;

interface ChatStateUnified {
  currentService: CurrentService;
  services: ChatServiceState;
  currentView: CurrentView;

  // existingChats: string[];
  // isLoading: boolean;

  setCurrentService: (serviceName: CurrentService) => void;
  loadRagDocs: () => void;

  // other previous methods
  createChat: (chat: CreateChat) => void;
  loadChat: (chatName: string) => void;
  deleteChat: (chatName: string) => void;
  sendMessage: () => Promise<void>;
  setInputMessage: (message: string) => void;
  setSelectedChat: (chatName: string) => void;
  setCurrentView: (currentView: CurrentView) => void;
  loadChats: () => void;
  setIsloading: (isLoading: boolean) => void;
  fetchInstalledModels: () => Promise<string[]>;
}

const useChatStore = create<ChatStateUnified>()(
  immer((set, get) => ({
    currentService: "chatService",
    currentView: "chatList",

    existingChats: [],
    isLoading: false,

    services: {
      chatService: {
        messages: [],
        existingChats: [],
        selectedChat: null,
        inputMessage: "",
        isLoading: false,
        name: "chatService",
      },
      codeFixService: {
        messages: [],
        existingChats: [],
        selectedChat: null,
        inputMessage: "",
        isLoading: false,
        name: "codeFixService",
      },
      ragChatService: {
        messages: [],
        existingChats: [],
        selectedChat: null,
        inputMessage: "",
        isLoading: false,
        name: "ragChatService",
      },
    },

    setCurrentService: (serviceName) => set({ currentService: serviceName }),
    setCurrentView: (currentView) => set({ currentView }),

    loadRagDocs: async () => {
      const { currentService } = get();

      if (currentService === "ragChatService") {
        // const fileManagementService = new FileManagementService();
        // const files = fileManagementService.listFiles();
        // const filesLoaderService = new FilesLoaderService();
        // const docs = await filesLoaderService.loadFiles(files);
        // await chatServices[currentService].createVectorStore(docs);
        // await chatServices[currentService].createChatChain();
      }
    },

    setIsloading: (isLoading) => {
      const { currentService } = get();
      set((state) => {
        state.services[currentService].isLoading = isLoading;
      });
    },

    setInputMessage: (message) => {
      const { currentService } = get();
      set((state) => {
        state.services[currentService].inputMessage = message;
      });
    },
    // setSelectedChat: (chatName) => set({ selectedChat: chatName }),

    setSelectedChat: (chatName) => {
      const { currentService } = get();
      set((state) => {
        state.services[currentService].selectedChat = chatName;
      });
    },

    loadChats: async () => {
      const { currentService } = get();

      set((state) => {
        state.services[currentService].isLoading = true; // Set loading to true
      });

      try {
        const chats = await chatServices[currentService].listChats();
        set((state) => {
          state.services[currentService].existingChats = chats;
        });
      } catch (error) {
        console.error("Error loading chats:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Loading Chats",
          message: "An error occurred while loading chats.",
        });
      } finally {
        set((state) => {
          state.services[currentService].isLoading = false; // Set loading to false
        });
      }
    },

    createChat: ({ model, chatName }) => {
      const { currentService } = get();
      const service = chatServices[currentService];

      service.createChat({ model, chatName });

      // Update the existing chats in the state
      set((state) => {
        state.services[currentService].existingChats.push(generateChatName(chatName, model));
      });
    },

    loadChat: (chatName) => {
      const { currentService } = get();
      const service = chatServices[currentService];

      // Load chat history from the current service
      const loadedMessages = service.loadChatHistory(chatName);

      set((state) => {
        state.services[currentService].messages = loadedMessages;
        state.services[currentService].selectedChat = chatName;
      });
    },

    deleteChat: (chatName) => {
      const { currentService } = get();
      const service = chatServices[currentService];

      // Delete chat using the current service
      service.deleteChat(chatName);

      showToast({
        style: Toast.Style.Success,
        title: "Chat Deleted",
        message: `Successfully deleted chat "${chatName}"`,
      });

      // Update the existing chats in the state
      set((state) => {
        state.services[currentService].existingChats = state.services[currentService].existingChats.filter(
          (chat) => chat !== chatName,
        );
      });
    },

    sendMessage: async () => {
      const { currentService, services: stateServices } = get();

      //! Getting Service from the state
      const currentServicee = stateServices[currentService];
      const { inputMessage, selectedChat } = currentServicee;

      if (!inputMessage.trim() || !selectedChat) return;

      // const model = selectedChat.split("-")[1]; // Extract model from selectedChat
      const model = selectedChat.split("__")[1]; // Extract model from selectedChat

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: inputMessage,
        timestamp: moment().valueOf(),
      };

      console.log("userMessage", userMessage);

      set((state) => {
        state.services[currentService].messages.push(userMessage);
        state.services[currentService].inputMessage = "";
        state.services[currentService].isLoading = true;
      });

      let assistantResponse = "";
      const messageId = nanoid();

      //! Getting chat Service
      const service = chatServices[currentService];

      let chatFunction: ChatFunction;
      if (currentService === "codeFixService" && service instanceof CodeFixService) {
        chatFunction = service.fixCode;
      } else {
        chatFunction = service.streamOllamaResponse;
      }

      try {
        await chatFunction.call(
          service,
          model,
          selectedChat,
          inputMessage,
          (chunk, timestamp) => {
            assistantResponse += chunk;

            set((state) => {
              const lastMessage =
                state.services[currentService].messages[state.services[currentService].messages.length - 1];

              if (lastMessage?.id === messageId) {
                lastMessage.content = assistantResponse; // Update the last message
                lastMessage.timestamp = timestamp; // Update the timestamp
              } else {
                state.services[currentService].messages.push({
                  id: messageId,
                  role: "assistant",
                  content: chunk,
                  timestamp,
                });
              }
            });
          },
          () => {
            console.log("Response streaming ended.");
            set((state) => {
              state.services[currentService].isLoading = false;
            });
          },
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error streaming response:", error);
          showToast({
            style: Toast.Style.Failure,
            title: "Error Sending Message",
            message: error.message,
          });
        } else {
          console.error("Unexpected error:", error);
          showToast({
            style: Toast.Style.Failure,
            title: "Error Sending Message",
            message: "An unexpected error occurred.",
          });
        }
        set((state) => {
          state.services[currentService].isLoading = false;
        });
      }
    },

    fetchInstalledModels: async () => {
      try {
        const models = await chatServices.chatService.getInstalledModels();
        return models;
      } catch (error) {
        console.error("Failed to fetch installed models:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Fetching Models",
          message: "Could not retrieve the list of installed models.",
        });
        return [];
      }
    },
  })),
);

export default useChatStore;
