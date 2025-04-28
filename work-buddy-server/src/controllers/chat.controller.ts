import { Request, Response } from "express";

import { DocumentChatService } from "@/lib/services/DocumentChatService";
import { ChatHistory, StreamRequestBody } from "@/types";

const documentChatService = new DocumentChatService();

export const ragChat = async (req: Request, res: Response) => {
  const { model, chatName, query, chatHistory }: StreamRequestBody = req.body;

  if (!model || !chatName || !query || !chatHistory) {
    console.error("All fields are required");

    return;
  }
  // Set response headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Flush the headers immediately

  // Function to send data chunks to the client
  const sendData = (data: {
    chunk: string;
    timestamp: number;
    isEnded: boolean;
  }) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let assistantResponse = "";

    // Use your RAG chat service to process the request
    await documentChatService.streamOllamaResponse(
      "mistral:latest", // Model name
      chatName,
      query,
      chatHistory as Array<ChatHistory>,
      (chunk: string, timestamp: number) => {
        // Send each chunk of data as it is generated
        assistantResponse += chunk;

        sendData({ chunk, timestamp, isEnded: false });
      },
      () => {
        // End the stream when processing is complete
        sendData({
          chunk: assistantResponse,
          timestamp: Date.now(),
          isEnded: true,
        });
        res.end(); // Close the response stream
      }
    );
  } catch (error) {
    console.error("Error while processing message:", error);
    res.status(500).send({ error: "Error processing message." });
  }
};
