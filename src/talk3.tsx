import { useState } from "react";
import { ActionPanel, Detail, Form, Action } from "@raycast/api";
import { streamOllamaResponse } from "./lib/utils/chatService";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatComponent() {
  const [chatName, setChatName] = useState("default_chat");
  const [model, setModel] = useState("mistral:latest");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // Store chat history
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  async function handleSubmit() {
    if (!query.trim()) return; // Don't send empty messages

    setIsLoading(true); // Start loading
    setMessages((prev) => [...prev, { role: "user", content: query }]); // Add user message to history

    let assistantResponse = "";

    await streamOllamaResponse(
      model,
      chatName,
      query,
      (chunk) => {
        setIsLoading(false); // Stop loading

        assistantResponse += chunk; // Accumulate assistant's response
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "assistant") {
            // Update the last assistant message
            return [...prev.slice(0, -1), { role: "assistant", content: assistantResponse }];
          } else {
            // Add a new assistant message
            return [...prev, { role: "assistant", content: assistantResponse }];
          }
        });
      },
      () => {
        setIsLoading(false); // Stop loading
        setQuery(""); // Clear the input field
      },
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Send" onAction={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="chatName" title="Chat Name" value={chatName} onChange={setChatName} />
      <Form.TextField
        id="model"
        title="Model Name"
        value={model}
        onChange={setModel}
        placeholder="e.g., llama2, mistral, gemma"
      />
      <Form.TextArea
        id="query"
        title="Your Message"
        value={query}
        onChange={setQuery}
        placeholder="Type your message here..."
      />
      <Form.Description
        title="Chat History"
        text={messages.map((msg) => `**${msg.role}:**\n${msg.content}`).join("\n\n")}
      />
      {isLoading && <Form.Description text="Loading..." />}
    </Form>
  );
}
