import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import moment from "moment";
import { nanoid } from "nanoid";
import { showToast, Toast } from "@raycast/api";
import { ChatService } from "@/lib/services/ChatService";
import { ChatMessage, CreateChat, CurrentView } from "@/types/index";

const chatService = new ChatService();

interface ChatState {
  messages: ChatMessage[];
  existingChats: string[];
  selectedChat: string | null;
  inputMessage: string;
  currentView: CurrentView;
  isLoading: boolean;
  createChat: (chat: CreateChat) => void;
  loadChat: (chatName: string) => void;
  deleteChat: (chatName: string) => void;
  sendMessage: () => Promise<void>;
  setInputMessage: (message: string) => void;
  setSelectedChat: (chatName: string) => void;
  setCurrentView: (currentView: CurrentView) => void;
  loadChats: () => void;
  setIsloading: (isLoading: boolean) => void;
}

const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    messages: [],
    existingChats: [],
    selectedChat: null,
    inputMessage: "",
    currentView: "chatList",
    isLoading: false,

    setIsloading: (isLoading) => set({ isLoading }),
    setInputMessage: (message) => set({ inputMessage: message }),
    setSelectedChat: (chatName) => set({ selectedChat: chatName }),
    setCurrentView: (currentView) => set({ currentView }),

    // loadChats: () => {
    //   set({ existingChats: chatService.listChats() });
    // },

    loadChats: async () => {
      set({ isLoading: true }); // Set loading to true
      try {
        const chats = await chatService.listChats(); // Assuming this is an async call
        set({ existingChats: chats });
      } catch (error) {
        console.error("Error loading chats:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Loading Chats",
          message: "An error occurred while loading chats.",
        });
      } finally {
        set({ isLoading: false }); // Set loading to false
      }
    },

    createChat: ({ model, chatName }) => {
      chatService.createChat({ model, chatName });
      set((state) => ({
        existingChats: [...state.existingChats, `${chatName}-${model}`],
      }));
    },

    loadChat: (chatName) => {
      const loadedMessages = chatService.loadChatHistory(chatName);
      set({ messages: loadedMessages, selectedChat: chatName });
    },

    deleteChat: (chatName) => {
      chatService.deleteChat(chatName);
      showToast({
        style: Toast.Style.Success,
        title: "Chat Deleted",
        message: `Successfully deleted chat "${chatName}"`,
      });
      set({ existingChats: chatService.listChats() });
    },

    sendMessage: async () => {
      const state = get();
      const { inputMessage, selectedChat, messages } = state;

      if (!inputMessage.trim() || !selectedChat) return;

      const model = selectedChat.split("-")[1]; // Extract model from selectedChat

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: inputMessage,
        timestamp: moment().valueOf(),
      };

      set({ messages: [...messages, userMessage], inputMessage: "", isLoading: true });

      let assistantResponse = "";
      const messageId = nanoid();

      try {
        await chatService.streamOllamaResponse(
          model,
          selectedChat,
          inputMessage,
          (chunk, timestamp) => {
            assistantResponse += chunk;

            set((state) => {
              const lastMessage = state.messages[state.messages.length - 1];
              if (lastMessage?.id === messageId) {
                return {
                  messages: [
                    ...state.messages.slice(0, -1),
                    { id: messageId, role: "assistant", content: assistantResponse, timestamp },
                  ],
                };
              } else {
                return {
                  messages: [...state.messages, { id: messageId, role: "assistant", content: chunk, timestamp }],
                };
              }
            });
          },
          () => {
            console.log("Response streaming ended.");
            set({ isLoading: false });
          },
        );
      } catch (error) {
        console.error("Error streaming response:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Sending Message",
          message: "An error occurred while sending the message.",
        });
      }
    },
  })),
);

export default useChatStore;
