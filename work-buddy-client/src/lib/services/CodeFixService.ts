import fs from "fs";
import path from "path";
import axios from "axios";
import moment from "moment";

import { ChatService } from "./ChatService";

export class CodeFixService extends ChatService {
  private customPrompts: { role: string; content: string; timestamp: number }[];

  constructor(customPrompts: { role: string; content: string; timestamp: number }[]) {
    super(); // Call the constructor of the parent class
    this.customPrompts = customPrompts; // Set the custom prompts for code fixing

    // Set a separate chat directory for code fixing
    this.CHAT_DIR = path.join(__dirname, "code_fixes");
    if (!fs.existsSync(this.CHAT_DIR)) fs.mkdirSync(this.CHAT_DIR);
  }

  // New method for handling user queries with custom prompts
  public async fixCode(
    model: string,
    chatName: string,
    query: string,
    onData: (chunk: string, timestamp: number) => void,
    onEnd: () => void,
  ): Promise<void> {
    console.log("inside fixCode", {
      model,
      chatName,
      query,
    });

    // Check if the Ollama server is running only once
    if (this.isOllamaRunning === null) {
      this.isOllamaRunning = await this.isOllamaServerRunning(model);
    }

    if (!this.isOllamaRunning) {
      console.error("Ollama server is not running. Aborting request.");
      throw new Error("Ollama server is not running.");
    }

    const chatHistory = this.loadChatHistory(chatName);

    // Prepare the messages array with custom prompts
    const messages = [
      ...this.customPrompts, // Append custom prompts
      ...chatHistory, // Include previous chat history
      { role: "user", content: query, timestamp: moment().valueOf() }, // Add the user's query
    ];

    // Add the new user message to the chat history
    this.appendMessage(chatName, "user", query);

    try {
      const response = await axios.post(
        "http://localhost:11434/api/chat",
        {
          model: model,
          messages: messages,
          stream: true,
        },
        {
          responseType: "stream",
        },
      );

      let assistantResponse = "";

      response.data.on("data", (chunk: Buffer) => {
        const data = chunk.toString();
        const jsonResponse = JSON.parse(data);
        assistantResponse += jsonResponse.message.content;
        const timestamp = moment().valueOf(); // Get the current Unix timestamp using Moment.js

        onData(jsonResponse.message.content, timestamp);
      });

      response.data.on("end", () => {
        console.log("response Ended");
        // Add the assistant's response to the chat history
        this.appendMessage(chatName, "assistant", assistantResponse);
        onEnd();
      });

      response.data.on("error", (err: Error) => {
        console.error("Stream error:", err);
      });
    } catch (err) {
      console.error("Failed to start Ollama chat process:", err);
      throw err;
    }
  }
}

export const CUSTOM_PROMPTS = [
  { role: "system", content: "You are a code assistant.", timestamp: moment().valueOf() },
  {
    role: "system",
    content: "Your task is to help fix the following code or answer the question.",
    timestamp: moment().valueOf(),
  },
];
