import { useEffect } from "react";
import { ActionPanel, Action, List } from "@raycast/api";

import useChatStore from "@/store/chatStore";

export const ChatList = () => {
  const existingChats = useChatStore((state) => state.existingChats);
  const loadChat = useChatStore((state) => state.loadChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const setCurrentView = useChatStore((state) => state.setCurrentView);
  const loadChats = useChatStore((state) => state.loadChats);
  const isLoading = useChatStore((state) => state.isLoading);

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
