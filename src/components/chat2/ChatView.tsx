import { ActionPanel, Action, List } from "@raycast/api";
import moment from "moment";

import useChatStore from "@/store/chatStore";

export const ChatView = () => {
  const messages = useChatStore((state) => state.messages);
  const inputMessage = useChatStore((state) => state.inputMessage);
  const setInputMessage = useChatStore((state) => state.setInputMessage);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isLoading = useChatStore((state) => state.isLoading);

  const isChatEmpty = messages.length === 0;

  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={!isChatEmpty}
      filtering={false}
      searchText={inputMessage}
      onSearchTextChange={setInputMessage}
      navigationTitle="AI Chat"
      searchBarPlaceholder="Ask AI..."
    >
      {(() => {
        if (isChatEmpty) {
          return (
            <List.EmptyView
              title="Ask GPT Anything..."
              actions={
                <ActionPanel>
                  <Action
                    title="Send to AI"
                    onAction={() => {
                      /* Handle reply */
                      sendMessage();
                    }}
                  />
                  <Action
                    title="Compose Message"
                    onAction={() => {
                      /* Handle reply */
                    }}
                  />
                </ActionPanel>
              }
            />
          );
        }

        // return messages.map((msg, index) => {
        return sortedMessages.map((msg, index) => {
          return (
            <>
              <List.Item
                key={index}
                title={msg.role === "user" ? `You - ${msg.content}` : `Assistant - ${msg.content}`}
                subtitle={`${moment(msg.timestamp).fromNow(true)}`} // Optional: Display message index or timestamp
                detail={
                  <List.Item.Detail markdown={`**${msg.role === "user" ? "You" : "Assistant"}:**\n\n${msg.content}`} />
                }
                actions={
                  <ActionPanel>
                    <Action
                      title="Send to AI"
                      onAction={() => {
                        /* Handle reply */
                        sendMessage();
                      }}
                    />
                    <Action
                      title="Compose Message"
                      onAction={() => {
                        /* Handle reply */
                      }}
                    />
                  </ActionPanel>
                }
              />
            </>
          );
        });
      })()}
    </List>
  );
};
