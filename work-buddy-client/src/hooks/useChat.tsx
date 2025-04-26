import moment from "moment";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { showToast, Toast } from "@raycast/api";

import { ChatService } from "@/lib/services/ChatService";
import { ChatMessage, CreateChat } from "@/types/index";

const chatService = new ChatService();

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [existingChats, setExistingChats] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState<string>("");

  const messageIdRef = useRef<string | null>(null);
  const accumulatedResponseRef = useRef<string>("");

  useEffect(() => {
    setExistingChats(chatService.listChats());
  }, []);

  const createChat = ({ model, chatName }: CreateChat) => {
    chatService.createChat({ model, chatName });
  };

  const loadChat = (chatName: string) => {
    const loadedMessages = chatService.loadChatHistory(chatName);
    setMessages(loadedMessages);
    setSelectedChat(chatName);
  };

  const deleteChat = (chatName: string) => {
    chatService.deleteChat(chatName);
    showToast({
      style: Toast.Style.Success,
      title: "Chat Deleted",
      message: `Successfully deleted chat "${chatName}"`,
    });
    setExistingChats(chatService.listChats());
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const model = selectedChat?.split("-")[1]; // Extract model from selectedChat

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: inputMessage,
      timestamp: moment().valueOf(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    messageIdRef.current = nanoid();
    accumulatedResponseRef.current = "";

    let assistantResponse = "";

    await chatService.streamOllamaResponse(
      model,
      selectedChat!,
      inputMessage,
      (chunk, timestamp) => {
        assistantResponse += chunk;
        accumulatedResponseRef.current = assistantResponse;

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.id === messageIdRef.current) {
            return [
              ...prev.slice(0, -1),
              { id: messageIdRef.current!, role: "assistant", content: accumulatedResponseRef.current, timestamp },
            ];
          } else {
            return [...prev, { id: messageIdRef.current!, role: "assistant", content: chunk, timestamp }];
          }
        });
      },
      () => {
        console.log("Response streaming ended.");
      },
    );
  };

  return {
    messages,
    existingChats,
    loadChat,
    deleteChat,
    sendMessage,
    inputMessage,
    setInputMessage,
    createChat,
  };
};
