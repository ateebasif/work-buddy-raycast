import { useEffect, useRef, useState } from "react";
import { ActionPanel, Action, List, Detail, Form, Toast, showToast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import { nanoid } from "nanoid";
import moment from "moment";

import { ChatService } from "./lib/services/ChatService";
import { ChatMessage } from "./types";

// Mock data for existing chats and models
const models = ["mistral:latest", "deepseek-r1:1.5b", "llama3.2:latest"];
const chatService = new ChatService();

interface CreateChat {
  model: string;
  chatName: string;
}

const Talk = () => {
  const [step, setStep] = useState<"chatList" | "modelSelection" | "chatView">("chatList");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [existingChats, setExistingChats] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");

  const messageIdRef = useRef<string | null>(null); // Track current assistant message ID
  const accumulatedResponseRef = useRef<string>(""); // Store streamed content

  useEffect(() => {
    setExistingChats(chatService.listChats());
  }, []);

  const loadChat = (chatName: string) => {
    const loadedMessages = chatService.loadChatHistory(chatName);
    setMessages(loadedMessages);
    setSelectedChat(chatName);
    setStep("chatView");
  };

  const refreshChatList = () => {
    const chats = chatService.listChats();
    setExistingChats(chats);
  };

  const deleteChat = (chatName: string) => {
    chatService.deleteChat(chatName);
    showToast({
      style: Toast.Style.Success,
      title: "Chat Deleted",
      message: `Successfully deleted chat "${chatName}"`,
    });
    refreshChatList(); // Refresh the chat list after deletion
  };

  const { handleSubmit, itemProps } = useForm<CreateChat>({
    onSubmit(values) {
      showToast({
        style: Toast.Style.Success,
        title: "Yay! creating chat",
        message: `creating chat with name ${values.chatName}  and model ${values.model}`,
      });

      chatService.createChat({ model: values.model, chatName: values.chatName });

      loadChat(`${values.chatName}-${values.model}`);
    },
    validation: {
      chatName: FormValidation.Required,
      model: FormValidation.Required,
    },
  });

  console.log("messages", messages);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return; // Prevent sending empty messages

    const model = selectedChat?.split("-")[1]; // Extract model from selectedChat
    // Create a new user message with a timestamp
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: inputMessage,
      timestamp: moment().valueOf(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage(""); // Clear input field

    messageIdRef.current = nanoid();
    accumulatedResponseRef.current = "";

    let assistantResponse = "";

    // Stream response from the assistant
    await chatService.streamOllamaResponse(
      model!,
      selectedChat!,
      inputMessage,
      (chunk, timestamp) => {
        assistantResponse += chunk; // Accumulate assistant's response
        accumulatedResponseRef.current = assistantResponse;

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage?.id === messageIdRef.current) {
            // Update the last assistant message
            return [
              ...prev.slice(0, -1),
              {
                id: messageIdRef.current as string,
                role: "assistant",
                content: accumulatedResponseRef.current,
                timestamp,
              },
            ];
          } else {
            // Add a new assistant message
            return [...prev, { id: messageIdRef.current as string, role: "assistant", content: chunk, timestamp }];
          }
        });
      },
      () => {
        // Handle end of response
        console.log("Response streaming ended.");
      },
    );
  };

  const messageCopy = [...messages].sort((a, b) => b.timestamp - a.timestamp);

  const isChatEmpty = (chat: ChatMessage[]) => {
    return chat.length === 0;
  };

  // Step 1: Show previous chat list or option to create a new chat
  if (step === "chatList") {
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
        {existingChats
          .filter((chat) => chat !== ".DS_Store")
          .map((chat) => (
            <List.Item
              key={chat}
              title={chat}
              actions={
                <ActionPanel>
                  <Action
                    title="Select Chat"
                    onAction={() => {
                      loadChat(chat);
                    }}
                  />

                  <Action title="Delete Chat" onAction={() => deleteChat(chat)} />
                </ActionPanel>
              }
            />
          ))}
      </List>
    );
  }

  // Step 2: Model selection for new chat
  if (step === "modelSelection") {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
          </ActionPanel>
        }
      >
        <Form.TextField title="Chat Name" placeholder="Tim Cook" error="Required" {...itemProps.chatName} />

        <Form.Dropdown id="model" title="AI Model" defaultValue="mistral:latest">
          {models.map((model) => (
            <Form.Dropdown.Item key={model} value={model} title={model} icon="🚀" />
          ))}
        </Form.Dropdown>
      </Form>
    );
  }

  if (step === "chatView") {
    return (
      <>
        <List
          isShowingDetail={!isChatEmpty(messages)}
          filtering={false}
          searchText={inputMessage}
          onSearchTextChange={setInputMessage}
          navigationTitle="AI Chat"
          searchBarPlaceholder="Ask AI..."
        >
          {(() => {
            if (isChatEmpty(messages)) {
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
            return messageCopy.map((msg, index) => {
              return (
                <>
                  <List.Item
                    key={index}
                    title={msg.role === "user" ? `You - ${msg.content}` : `Assistant - ${msg.content}`}
                    subtitle={`${moment(msg.timestamp).fromNow(true)}`} // Optional: Display message index or timestamp
                    detail={
                      <List.Item.Detail
                        markdown={`**${msg.role === "user" ? "You" : "Assistant"}:**\n\n${msg.content}`}
                      />
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
      </>
    );
  }

  return <Detail markdown="# Welcome to Talk" />;
};

export default Talk;
