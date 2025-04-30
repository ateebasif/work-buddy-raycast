import { useEffect } from "react";
import { ActionPanel, Action, List } from "@raycast/api";

import useUnifiedChatStore from "@/store/unifiedChatStore";

export const ChatList = () => {
  const loadChat = useUnifiedChatStore((state) => state.loadChat);
  const deleteChat = useUnifiedChatStore((state) => state.deleteChat);
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);
  const loadChats = useUnifiedChatStore((state) => state.loadChats);
  const currentService = useUnifiedChatStore((state) => state.currentService);
  const services = useUnifiedChatStore((state) => state.services);

  const isLoading = services[currentService].isLoading;
  const existingChats = services[currentService].existingChats;

  const onChatSelect = (chat: string) => {
    loadChat(chat);
    setCurrentView("chatView");
  };

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <List navigationTitle="Start Chat" searchBarPlaceholder="Select a Chat" isLoading={isLoading}>
      <List.Item
        title="Create New Chat"
        actions={
          <ActionPanel>
            <Action title="Create New Chat" onAction={() => setCurrentView("createChat")} />
          </ActionPanel>
        }
      />

      {existingChats.map((chat, index) => (
        <List.Item
          key={chat + index}
          title={chat}
          actions={
            <ActionPanel>
              <Action title="Select Chat" onAction={() => onChatSelect(chat)} />
              <Action title="Delete Chat" onAction={() => deleteChat(chat)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
