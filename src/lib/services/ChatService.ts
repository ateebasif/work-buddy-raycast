import fs from "fs";
import path from "path";
import axios from "axios";
import moment from "moment";

import { ChatMessage, CreateChat } from "@/types/index";

export class ChatService {
  private CHAT_DIR: string;

  constructor() {
    this.CHAT_DIR = path.join(__dirname, "chats");
    if (!fs.existsSync(this.CHAT_DIR)) fs.mkdirSync(this.CHAT_DIR);
  }

  public createChat({ model, chatName }: CreateChat): void {
    const chatFile = this.getChatFile(`${chatName}-${model}`);
    if (!fs.existsSync(chatFile)) {
      fs.writeFileSync(chatFile, "", "utf8"); // Create an empty file
      console.log(`Chat "${chatName}" with model "${model}" created successfully.`);
    } else {
      console.log(`Chat "${chatName}" with model "${model}" already exists.`);
    }
  }

  private getChatFile(chatName: string): string {
    return path.join(this.CHAT_DIR, `${chatName}.txt`);
  }

  public appendMessage(chatName: string, role: string, content: string): void {
    const chatFile = this.getChatFile(chatName);
    const timestamp = moment().valueOf(); // Get the current Unix timestamp using Moment.js
    const message = JSON.stringify({ role, content, timestamp });
    fs.appendFileSync(chatFile, message + "\n", "utf8");
  }

  public loadChatHistory(chatName: string): Array<ChatMessage> {
    console.log("loading chat with name", chatName);
    const chatFile = this.getChatFile(chatName);
    if (!fs.existsSync(chatFile)) return [];

    const lines = fs.readFileSync(chatFile, "utf8").trim().split("\n");

    console.log("lines", lines);

    // Check if lines are empty
    if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
      return []; // Return an empty array if the file is empty
    }

    return lines.map((line) => JSON.parse(line));
  }

  public renameChat(oldName: string, newName: string): void {
    const oldFile = this.getChatFile(oldName);
    const newFile = this.getChatFile(newName);
    if (fs.existsSync(oldFile)) fs.renameSync(oldFile, newFile);
  }

  public listChats(): string[] {
    return (
      fs
        .readdirSync(this.CHAT_DIR)
        .map((file) => path.basename(file, ".txt"))
        .filter((chat) => chat !== ".DS_Store") || []
    );
  }

  public deleteChat(chatName: string): void {
    const chatFile = this.getChatFile(chatName);
    if (fs.existsSync(chatFile)) fs.unlinkSync(chatFile);
  }

  public async streamOllamaResponse(
    model = "mistral:latest",
    chatName: string,
    query: string,
    onData: (chunk: string, timestamp: number) => void,
    onEnd: () => void,
  ): Promise<void> {
    console.log("inside streamOllamaResponse", {
      model,
      chatName,
      query,
    });

    const chatHistory = this.loadChatHistory(chatName);

    // Add the new user message to the chat history
    this.appendMessage(chatName, "user", query);

    try {
      const response = await axios.post(
        "http://localhost:11434/api/chat",
        {
          model: model,
          messages: [...chatHistory, { role: "user", content: query }],
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
        console.log("jsonResponse", jsonResponse);
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

// Example Usage
// const chatService = new ChatService();
// chatService.appendMessage("bug_fixes", "user", "How do I fix this bug?");
// chatService.appendMessage("bug_fixes", "assistant", "Try checking the error logs.");
// console.log(chatService.loadChatHistory("bug_fixes"));

// chatService.renameChat("bug_fixes", "debugging_tips");
// console.log(chatService.listChats());

// // Switching model and streaming query
// chatService.streamOllamaResponse(
//   "llama2",
//   "debugging_tips",
//   "Can you help me fix this bug?",
//   (chunk) => {
//     console.log(chunk);
//   },
//   () => {
//     console.log("Stream finished.");
//   },
// );
