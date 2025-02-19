import fs from "fs";
import path from "path";
import { exec } from "child_process";

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
function switchModelAndStream(model: string, chatName: string, query: string): void {
  const chatHistory = loadChatHistory(chatName);
  const context = chatHistory.map((entry) => `${entry.role}: ${entry.content}`).join("\n");

  streamResponse(model, `${context}\nuser: ${query}`);
}

//! Stream the output of the model
function streamResponse(model: string, prompt: string): void {
  const process = exec(`ollama run ${model} --stream "${prompt}"`);

  process.stdout?.on("data", (data: Buffer) => {
    // Print each piece of data as it arrives (streamed output)
    process.stdout?.write(data.toString());
  });

  process.stderr?.on("data", (data: Buffer) => {
    console.error("Error:", data.toString());
  });

  process.on("close", (code: number) => {
    if (code === 0) {
      console.log("Stream finished.");
    } else {
      console.error(`Process exited with code ${code}`);
    }
  });
}

// Example Usage
appendMessage("bug_fixes", "user", "How do I fix this bug?");
appendMessage("bug_fixes", "assistant", "Try checking the error logs.");
console.log(loadChatHistory("bug_fixes"));

renameChat("bug_fixes", "debugging_tips");
console.log(listChats());

// Switching model and streaming query
switchModelAndStream("llama2", "debugging_tips", "Can you help me fix this bug?");
