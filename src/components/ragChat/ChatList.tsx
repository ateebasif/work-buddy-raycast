import { useEffect } from "react";
import { ActionPanel, Action, List } from "@raycast/api";

import useUnifiedChatStore from "@/store/unifiedChatStore";
import { CurrentView } from "@/types/index";

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

  const handleActionChange = (action: string) => {
    setCurrentView(action as CurrentView);
  };

  return (
    <List
      navigationTitle="Start Chat"
      searchBarPlaceholder="Select a Chat"
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Select Action" onChange={handleActionChange}>
          <List.Dropdown.Item title="Chat List" value="chatList" />
          <List.Dropdown.Item title="Create New Chat" value="createChat" />
          <List.Dropdown.Item title="Manage Files" value="fileList" />
        </List.Dropdown>
      }
    >
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
