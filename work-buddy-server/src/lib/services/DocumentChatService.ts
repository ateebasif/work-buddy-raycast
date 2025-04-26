import { Document } from "@langchain/core/documents";
import { ChatOllama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  MessagesPlaceholder,
  ChatPromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import moment from "moment";
import axios from "axios";

import { OLLAMA_BASE_URL, PGVECTOR_CONFIG } from "@/constants";
import { ChatHistory } from "@/types";

// Convert text into embeddings
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: OLLAMA_BASE_URL,
});

export class DocumentChatService {
  private model: ChatOllama;
  private chat_history: (HumanMessage | SystemMessage)[] = [];
  private vectorStore!: PGVectorStore;
  private retrievalChain!: Runnable;
  protected isOllamaRunning: boolean | null = null; // Variable to cache the server status

  constructor() {
    this.model = new ChatOllama({
      model: "llama3.2:latest",
      baseUrl: OLLAMA_BASE_URL,
    });

    this.vectorStore = new PGVectorStore(embeddings, PGVECTOR_CONFIG);
    this.createChatChain();
  }

  //! Method to check if the Ollama server is running
  protected async isOllamaServerRunning(model = "llama3.2"): Promise<boolean> {
    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: model,
        prompt: "hey, just say hi",
      });

      // Log the response for debugging
      console.log("✅ Ollama is running:");
      return response.status === 200; // Assuming a 200 status means the server is running
    } catch (error) {
      console.error("❌ Ollama server is not running:", error);
      return false; // Server is not running
    }
  }

  async createVectorStore(documents: Document[]) {
    console.log("Step 2: Creating in memory vector store");

    // Split large documents into smaller chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500, // Reduce chunk size for better memory usage
      chunkOverlap: 10,
    });
    const splitDocs = await splitter.splitDocuments(documents);

    await this.vectorStore.addDocuments(splitDocs);

    console.log("-------Created in memory Vector Store-------");
  }

  async createRetriever() {
    // Create a retriever prompt to refine or rephrase/generate search queries based on chat history
    const retrieverRephrasePrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.",
      ],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
    ]);

    // Create retriever from vector store
    const retriever = this.vectorStore.asRetriever({
      k: 3, // Keep retrieval simple with a limit on the number of returned results
    });

    // Create history-aware retriever chain
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
      llm: this.model,
      retriever,
      rephrasePrompt: retrieverRephrasePrompt,
    });

    return historyAwareRetrieverChain;
  }

  async createChatChain() {
    const systemInstructions = `
          You are an intelligent and professional AI assistant designed to help users by answering questions and performing tasks using both the content of the provided documents and your general knowledge.

          Your behavior should adapt to the task and the available information.

          Instructions:

            1. **When using document context**:
              - If the documents contain **structured data** (e.g., JSON, CSV, tables), extract and present only the relevant fields, formatted cleanly and accurately.
              - If the documents contain **unstructured text** (e.g., resumes, PDFs, articles, emails), extract, synthesize, or summarize key information relevant to the query.
              - When asked for **specific values** (e.g., emails, phone numbers, skills, project titles), return them exactly as written in the documents.
              - If the user asks for the **source** of specific content, provide only the source (e.g., file name or metadata), unless content is explicitly requested as well.
              - If the query relates to **code**, check the documents for relevant examples, patterns, or code snippets. If found, use or adapt them accurately to solve the problem.
              - If the query involves writing a **job proposal, email, or formal document**, and relevant content (such as a resume, experience summary, or goals) is available, incorporate it into a well-structured, professional response.

            2. **When documents contain no relevant content**:
              - Respond to the user’s query using your general language capabilities.
              - Always make it clear that the response is **not based on the provided documents**, but generated from general knowledge or reasoning.

            3. **Tone & Output Formatting**:
              - Be clear, professional, and concise.
              - Format output appropriately: use bullet points, headings, or code blocks when helpful.
              - Avoid speculation if the question requires factual or document-based answers.

          If no relevant content is found in the documents, say:
          "I couldn't find relevant information in the provided documents."

          Document Context:\n\n
          {context}
`;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemInstructions],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
    ]);

    console.log("Step 3: Creating combined Docs Chain");

    const combineDocsChain = await createStuffDocumentsChain({
      llm: this.model,
      prompt,
      documentPrompt: PromptTemplate.fromTemplate(`
         Source: {source}\n\nPage Content: {page_content}`),
      documentSeparator: "\n-------------------\n",
    });

    console.log("Step 4: Creating Retriever (History Aware)");
    const retriever = await this.createRetriever();

    console.log("Step 5: Creating Retriever Chain");
    const retrievalChain = await createRetrievalChain({
      retriever,
      combineDocsChain: combineDocsChain,
    });

    this.retrievalChain = retrievalChain;
  }

  public async streamOllamaResponse(
    model = "mistral:latest",
    chatName: string,
    query: string,
    chatHistory: Array<ChatHistory> = [],
    onData: (chunk: string, timestamp: number) => void,
    onEnd: () => void
  ): Promise<void> {
    console.log("inside streamOllamaResponse", {
      model,
      chatName,
      query,
      chatHistory,
    });

    // Check if the Ollama server is running only once
    if (this.isOllamaRunning === null) {
      this.isOllamaRunning = await this.isOllamaServerRunning(model);
    }

    if (!this.isOllamaRunning) {
      console.error("Ollama server is not running. Aborting request.");
      throw new Error("Ollama server is not running.");
    }

    // Limit the history to the last 10 interactions for memory efficiency
    const historyToUse = chatHistory.slice(-10);

    console.log("⛩️ inside rag chat", { query });

    try {
      // Use the retrieval chain to stream the response
      const resultStream = await this.retrievalChain.stream({
        input: query,
        chat_history: historyToUse,
      });

      let assistantResponse = "";
      let buffer = "";
      let chunkCount = 0;
      const THROTTLE_RATE = 5; // Throttle to send every 5th chunk

      // Process each chunk of the streamed response
      for await (const chunk of resultStream) {
        if (chunk.answer) {
          const timestamp = moment().valueOf();
          buffer += chunk.answer;
          assistantResponse += chunk.answer;
          chunkCount++;

          // Throttle and send data incrementally to avoid memory overload
          if (chunkCount % THROTTLE_RATE === 0 || chunk.answer.includes("\n")) {
            onData(buffer, timestamp);
            buffer = ""; // Reset buffer
          }
        }
      }

      console.log("response Ended");
      // Add the assistant's response to the chat history
      this.chat_history.push(new HumanMessage(query));
      this.chat_history.push(new AIMessage(assistantResponse.trim())); // Store full AI response
      onEnd(); // Call the onEnd callback
    } catch (err) {
      console.error("Failed to start Ollama chat process:", err);
      throw err;
    }
  }
}
