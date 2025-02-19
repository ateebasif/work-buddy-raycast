import React, { useEffect, useState } from "react";
import { ActionPanel, Action, List, Detail, Form, Toast, showToast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

import { ChatService } from "./lib/services/ChatService";

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
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [existingChats, setExistingChats] = useState<string[]>([]);

  const [inputMessage, setInputMessage] = useState<string>("");

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

  useEffect(() => {
    const chats = chatService.listChats();
    setExistingChats(chats);
  }, []);

  const loadChat = (chatName: string) => {
    // Load messages for the selected chat (mock implementation)
    const messages = chatService.loadChatHistory(chatName);
    setMessages(messages);

    // setting other requird states
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

  const sendMessage = async () => {
    if (!inputMessage.trim()) return; // Prevent sending empty messages

    const model = selectedChat?.split("-")[1]; // Extract model from selectedChat
    // chatService.appendMessage(selectedChat!, "user", inputMessage); // Append user message

    // Update messages state
    setMessages((prev) => [...prev, { role: "user", content: inputMessage }]);
    setInputMessage(""); // Clear input field

    // Stream response from the assistant
    await chatService.streamOllamaResponse(
      model!,
      selectedChat!,
      inputMessage,
      (chunk) => {
        // Append assistant's response
        setMessages((prev) => [...prev, { role: "assistant", content: chunk }]);
      },
      () => {
        // Handle end of response
        console.log("Response streaming ended.");
      },
    );
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
        <List isShowingDetail>
          {messages.map((msg, index) => (
            <List.Item
              key={index}
              title={msg.role === "user" ? "You" : "Assistant"}
              subtitle={`#${index + 1}`} // Optional: Display message index or timestamp
              detail={
                <List.Item.Detail markdown={`**${msg.role === "user" ? "You" : "Assistant"}:**\n\n${msg.content}`} />
              }
              actions={
                <ActionPanel>
                  <Action
                    title="Reply"
                    onAction={() => {
                      /* Handle reply */
                    }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List>
      </>
    );
  }

  return <Detail markdown="# Welcome to Talk" />;
};

export default Talk;
