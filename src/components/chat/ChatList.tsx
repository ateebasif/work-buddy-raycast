import { StepView } from "@/types/index";
import { ActionPanel, Action, List } from "@raycast/api";

interface ChatListProps {
  existingChats: string[];
  loadChat: (chatName: string) => void;
  deleteChat: (chatName: string) => void;
  setStep: (step: StepView) => void;
}

export const ChatList = ({ existingChats, loadChat, deleteChat, setStep }: ChatListProps) => {
  const onChatSelect = (chat: string) => {
    loadChat(chat);
    setStep("chatView");
  };

  return (
    <List navigationTitle="Start Chat" searchBarPlaceholder="Select a Chat">
      <List.Item
        title="Create New Chat"
        actions={
          <ActionPanel>
            <Action title="Create New Chat" onAction={() => setStep("modelSelection")} />
          </ActionPanel>
        }
      />
      {existingChats.map((chat) => (
        <List.Item
          key={chat}
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
