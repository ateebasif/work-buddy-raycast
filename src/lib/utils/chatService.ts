import fs from "fs";
import path from "path";
import axios from "axios";

const CHAT_DIR = path.join(__dirname, "chats");
if (!fs.existsSync(CHAT_DIR)) fs.mkdirSync(CHAT_DIR);

//! Get chat file path
function getChatFile(chatName: string): string {
  return path.join(CHAT_DIR, `${chatName}.txt`);
}

//! Append a message to a specific chat
function appendMessage(chatName: string, role: string, content: string): void {
  const chatFile = getChatFile(chatName);
  const message = JSON.stringify({ role, content });
  fs.appendFileSync(chatFile, message + "\n", "utf8");
}

//! Load chat history from a specific file
function loadChatHistory(chatName: string): Array<{ role: string; content: string }> {
  const chatFile = getChatFile(chatName);
  if (!fs.existsSync(chatFile)) return [];
  const lines = fs.readFileSync(chatFile, "utf8").trim().split("\n");
  return lines.map((line) => JSON.parse(line));
}

//! Rename a chat session
function renameChat(oldName: string, newName: string): void {
  const oldFile = getChatFile(oldName);
  const newFile = getChatFile(newName);
  if (fs.existsSync(oldFile)) fs.renameSync(oldFile, newFile);
}

//! List all saved chat sessions
function listChats(): string[] {
  return fs.readdirSync(CHAT_DIR).map((file) => path.basename(file, ".txt"));
}

//! Delete a specific chat session
function deleteChat(chatName: string): void {
  const chatFile = getChatFile(chatName);
  if (fs.existsSync(chatFile)) fs.unlinkSync(chatFile);
}

//! Switch models and stream the response based on the chat history
export async function streamOllamaResponse(
  model: string,
  chatName: string,
  query: string,
  onData: (chunk: string) => void,
  onEnd: () => void,
): Promise<void> {
  const chatHistory = loadChatHistory(chatName);

  // Add the new user message to the chat history
  appendMessage(chatName, "user", query);

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
      onData(jsonResponse.message.content);
    });

    response.data.on("end", () => {
      console.log("response Ended");
      // Add the assistant's response to the chat history
      appendMessage(chatName, "assistant", assistantResponse);
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

// Example Usage
// appendMessage("bug_fixes", "user", "How do I fix this bug?");
// appendMessage("bug_fixes", "assistant", "Try checking the error logs.");
// console.log(loadChatHistory("bug_fixes"));

// renameChat("bug_fixes", "debugging_tips");
// console.log(listChats());

// Switching model and streaming query
// switchModelAndStream(
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
