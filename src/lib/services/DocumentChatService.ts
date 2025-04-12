import { Document } from "@langchain/core/documents";
import { ChatOllama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MessagesPlaceholder, ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import path from "path";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import fs from "fs";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import moment from "moment";

import { PGVECTOR_CONFIG } from "@/lib/constants";

import { ChatService } from "./ChatService";

// Convert text into embeddings
const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });

export class DocumentChatService extends ChatService {
  private model: ChatOllama;
  private chat_history: (HumanMessage | SystemMessage)[] = [];
  private vectorStore!: PGVectorStore;
  private retrievalChain!: Runnable;

  constructor() {
    super();
    this.CHAT_DIR = path.join(__dirname, "rag_chats");
    if (!fs.existsSync(this.CHAT_DIR)) fs.mkdirSync(this.CHAT_DIR);

    this.model = new ChatOllama({
      model: "llama3.2:latest",
      //   model: "qwen2.5-coder:latest",
      // verbose: true,
    });

    this.vectorStore = new PGVectorStore(embeddings, PGVECTOR_CONFIG);
    this.createChatChain();
  }

  async createVectorStore(documents: Document[]) {
    console.log("Step 2: Creating in memory vector store");

    // Split large documents into smaller chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
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
      k: 3,
      // searchType: "similarity",
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
    const agentPrompt2 = `You are an AI assistant that answers questions based on provided documents.
        - If the document is **structured (JSON, CSV, or similar)**, parse it and return relevant fields accurately.
        - If the document is **text-based**, extract and summarize relevant information.
        - If asked for an email, phone number, or specific data, **extract and return it exactly as written**.
        - if asked about the source of information only then extract the source return only the source, and return content only when asked.
        - If no relevant information is found, respond with: "I couldn't find relevant information in the provided documents.\n\n"

        Documents: {context}\n`;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", agentPrompt2],
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
    ]);

    console.log("Step 3: Creating combined Docs Chain");

    const combineDocsChain = await createStuffDocumentsChain({
      llm: this.model,
      prompt,
      //$ to format the document context -> you can adjust how the context should appear and add meta data for reference in the content. LLM can understand that and answer about the metadata content.
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
    onData: (chunk: string, timestamp: number) => void,
    onEnd: () => void,
  ): Promise<void> {
    console.log("inside streamOllamaResponse", {
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
    // Add the new user message to the chat history
    this.appendMessage(chatName, "user", query);

    console.log("⛩️ inside rag chat", { query });

    console.log("✅chatHistory", [...chatHistory, { role: "user", content: query }].length);

    try {
      // Use the retrieval chain to stream the response
      const resultStream = await this.retrievalChain.stream({
        input: query,
        chat_history: this.chat_history,
      });

      let assistantResponse = "";

      // Process each chunk of the streamed response
      for await (const chunk of resultStream) {
        if (chunk.answer) {
          const timestamp = moment().valueOf(); // Get the current Unix timestamp using Moment.js
          assistantResponse += chunk.answer; // Append chunk to response string
          onData(chunk.answer, timestamp); // Call the onData callback with the chunk
        }
      }

      console.log("response Ended");
      // Add the assistant's response to the chat history
      this.appendMessage(chatName, "assistant", assistantResponse.trim());
      this.chat_history.push(new HumanMessage(query));
      this.chat_history.push(new AIMessage(assistantResponse.trim())); // Store full AI response
      onEnd(); // Call the onEnd callback
    } catch (err) {
      console.error("Failed to start Ollama chat process:", err);
      throw err;
    }
  }
}
