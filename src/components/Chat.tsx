import React, { useState } from "react";
import { ActionPanel, Action, Form, Toast, showToast, List, Detail, Grid } from "@raycast/api";
import axios from "axios";

interface Message {
  content: string;
  role: "user" | "assistant";
}

const ChatComponent: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]); // Store messages as an array

  const handleSubmit = async () => {
    if (!inputText.trim()) return; // Prevent empty submissions

    setLoading(true);
    const url = "https://api.blackbox.ai/api/chat";
    const newMessage: Message = { content: inputText, role: "user" };

    // Add the new message to the messages array
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    const data = {
      messages: [...messages, newMessage], // Include previous messages in the request
      model: "deepseek-ai/deepseek-llm-67b-chat",
      // model: "mistralai/Mistral-Small-24B-Instruct-2501",
      max_tokens: "1024",
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      setInputText(""); // Clear the input field after submission

      const res = await axios.post(url, data, config);
      const assistantMessage: Message = { content: res.data, role: "assistant" };

      // Add the assistant's response to the messages array
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      showToast(Toast.Style.Success, "Request Successful", "Response received!");
    } catch (error) {
      console.error("error", error);
      showToast(Toast.Style.Failure, "Request Failed", "An error occurred while fetching the response.");
    } finally {
      setLoading(false);
      setInputText(""); // Clear the input field after submission
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Submit" onAction={handleSubmit} />
        </ActionPanel>
      }
    >
      {/* Display all messages */}
      {messages.map((message, index) => (
        <Form.Description key={index} title={message.role} text={message.content} />
      ))}

      {/* Display loading spinner if loading */}
      {loading ? <Form.Description title="Loading..." text="Please wait while we fetch the response. 🔁" /> : null}
      {/* Display loading spinner if loading */}

      {/* Input field at the bottom */}
      <Form.TextField
        id="inputText"
        title="Enter your message"
        placeholder="Type your message here..."
        value={inputText}
        onChange={setInputText}
      />
    </Form>
  );
};

export default ChatComponent;
