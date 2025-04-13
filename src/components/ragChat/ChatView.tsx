import { ActionPanel, Action, List, Clipboard, Toast, showToast } from "@raycast/api";
import moment from "moment";
import { useCallback, useEffect, useMemo } from "react";

import useUnifiedChatStore from "@/store/unifiedChatStore";

export const ChatView = () => {
  const setInputMessage = useUnifiedChatStore((state) => state.setInputMessage);
  const sendMessage = useUnifiedChatStore((state) => state.sendMessage);
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);

  const currentService = useUnifiedChatStore((state) => state.currentService);
  const services = useUnifiedChatStore((state) => state.services);

  const messages = services[currentService].messages;
  const inputMessage = services[currentService].inputMessage;
  const isLoading = services[currentService].isLoading;
  const selectedChat = services[currentService].selectedChat;

  const isChatEmpty = messages.length === 0;

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  useEffect(() => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`📈 Memory usage: ${used.toFixed(2)} MB`);
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={!isChatEmpty}
      filtering={false}
      searchText={inputMessage}
      onSearchTextChange={setInputMessage}
      // navigationTitle="AI Chat"
      navigationTitle={selectedChat || "AI Chat"}
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
                      handleSendMessage();
                    }}
                  />
                  <Action
                    title="Compose Message"
                    onAction={() => {
                      setCurrentView("composeMessage");
                    }}
                  />

                  <Action
                    title="Chat List"
                    shortcut={{ modifiers: ["opt"], key: "escape" }}
                    onAction={() => setCurrentView("chatList")}
                  />
                </ActionPanel>
              }
            />
          );
        }

        return sortedMessages.map((msg, index) => {
          return (
            <List.Item
              key={index}
              title={
                msg.role === "user" ? `You - ${msg.content.slice(0, 20)}` : `Assistant - ${msg.content.slice(0, 20)}`
              }
              subtitle={`${moment(msg.timestamp).fromNow(true)}`} // Optional: Display message index or timestamp
              detail={
                <List.Item.Detail markdown={`**${msg.role === "user" ? "You" : "Assistant"}:**\n\n${msg.content}`} />
              }
              actions={
                <ActionPanel>
                  <Action title="Send to AI" onAction={handleSendMessage} />
                  <Action
                    title="Compose Message"
                    onAction={() => {
                      setCurrentView("composeMessage");
                    }}
                  />
                  <Action
                    title="Copy to Clipboard"
                    onAction={async () => {
                      await Clipboard.copy(msg.content)
                        .then(() => {
                          showToast({
                            style: Toast.Style.Success,
                            title: "Copied to Clipboard",
                          });
                        })
                        .catch(() => {
                          showToast({
                            style: Toast.Style.Failure,
                            title: "Failed to Copy",
                          });
                        });
                    }}
                  />
                  <Action
                    title="Chat List"
                    shortcut={{ modifiers: ["opt"], key: "escape" }}
                    onAction={() => setCurrentView("chatList")}
                  />
                </ActionPanel>
              }
            />
          );
        });
      })()}
    </List>
  );
};
