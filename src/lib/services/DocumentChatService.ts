import axios from "axios";
import moment from "moment";
import { ChatService } from "./ChatService";
import fs from "fs";
import path from "path";

type Response = {
  chunk: string;
  timestamp: number;
  isEnded: boolean;
};

export class DocumentChatService extends ChatService {
  constructor() {
    super();
    this.CHAT_DIR = path.join(__dirname, "rag_chats");
    if (!fs.existsSync(this.CHAT_DIR)) fs.mkdirSync(this.CHAT_DIR);
  }

  // Method to stream the response from the API
  public async streamOllamaResponse(
    model: string,
    chatName: string,
    query: string,
    onData: (chunk: string, timestamp: number) => void,
    onEnd: () => void,
  ): Promise<void> {
    console.log("Inside streamOllamaResponse", { model, chatName, query });

    // Load chat history (if needed)
    const chatHistory = this.loadChatHistory(chatName);
    // Add the new user message to the chat history
    this.appendMessage(chatName, "user", query);

    try {
      // Prepare the body for the request
      const requestBody = {
        model,
        chatName,
        query,
        chatHistory,
      };

      // Send the request to the API endpoint for streaming
      const response = await axios.post("http://localhost:3000/stream", requestBody, {
        responseType: "stream", // Ensures we handle the response as a stream
      });

      // Listen for the 'data' event when chunks are received
      response.data.on("data", (chunk: Buffer) => {
        // Convert the chunk from a Buffer to a string
        let data = chunk.toString();

        // Check if the data starts with 'data: ' and remove it
        if (data.startsWith("data: ")) {
          data = data.slice(6); // Remove the 'data: ' prefix (6 characters)
        }

        try {
          // Parse the cleaned string into JSON
          const jsonResponse: Response = JSON.parse(data);

          console.log("jsonResponse", jsonResponse?.chunk);

          // Check if the parsed data contains the 'chunk' field and it is not '[END]'
          if (jsonResponse.chunk && !jsonResponse.isEnded) {
            // Get the current timestamp
            const timestamp = moment().valueOf();

            // Send the chunk to the callback function
            onData(jsonResponse.chunk, timestamp);
          } else {
            // Add the message in side the chat file
            console.log("stream ended", jsonResponse);
            this.appendMessage(chatName, "assistant", jsonResponse.chunk.trim());
          }
        } catch (err) {
          // Handle any errors during parsing
          console.error("Error parsing chunk:", err);
        }
      });

      // Handle the 'end' event when the stream is completed
      response.data.on("end", () => {
        console.log("Stream has ended");
        onEnd(); // Close the stream
      });

      // Handle any errors that occur during the streaming process
      response.data.on("error", (err: Error) => {
        console.error("Stream error:", err);
      });
    } catch (error) {
      // Catch and log any errors during the request
      console.error("Error during message processing:", error);
      throw error; // Rethrow the error to handle it outside
    }
  }
}
