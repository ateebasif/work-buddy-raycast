# Work Buddy - Your Local AI Assistant in Raycast

Work Buddy is a Raycast extension that brings the power of local AI models, powered by Ollama, directly to your fingertips. It offers two modes of interaction: simple chat and retrieval-augmented generation for more context-aware conversations.

## Prerequisites

Before you can start using Work Buddy, ensure you have the following installed and configured:

- **Raycast:** You need to have the Raycast application installed on your system. You can download it from [https://raycast.com/](https://raycast.com/).
- **Ollama:** Work Buddy relies on Ollama to run AI models locally. Please install Ollama by following the instructions on [https://ollama.ai/](https://ollama.ai/).
- **Ollama Models:** Work Buddy can utilize any AI model that you have downloaded and is managed by Ollama. To see the models you have available, you can use the following command in your terminal:

  ```bash
  ollama list
  ```

  You can download these models using Ollama in your terminal (e.g., `ollama pull mistral:latest`). Make sure you have at least one chat model downloaded to use the "Talk" feature and the nomic-embed-text:latest model for "RAG Talk".

- **Node.js:** Node.js is required to run and develop the Raycast extension. You can download it from [https://nodejs.org/](https://nodejs.org/).
- **Docker:** Docker is necessary to run the backend server and database for the "RAG Talk" functionality. Install Docker from [https://www.docker.com/](https://www.docker.com/).
- **Docker Compose:** Docker Compose is used to manage the server and database services. It is usually included with Docker Desktop.

## Features

Work Buddy offers two main ways to interact with AI:

### 1. Talk - Chat with Local AI

The "Talk" command allows you to have direct conversations with your locally running Ollama models.

https://github.com/user-attachments/assets/8adbe97b-03a8-4d07-94e6-f657cff1901c

**Initial Setup (for running the client):**

Before using the "Talk" command for the first time, you need to prepare the Raycast client:

1.  **Navigate to Client Directory:** Open your terminal and go to the `work-buddy-client` directory within your Work Buddy extension repository.
2.  **Install Dependencies:** Run the following command to install the required packages:
    ```bash
    npm install
    ```
3.  **Run the Client (Once):** Execute the development command to ensure the extension is built and recognized by Raycast:
    ```bash
    npm run dev
    ```
    This command will typically open the Raycast developer window and may automatically load your extension. You can close it once you see the extension is running.

**How to use:**

1.  Open the Raycast search panel by pressing `Command + Space`.
2.  Type `Talk`. The Work Buddy extension item will appear.
3.  Press `Enter` to open the chat view.
4.  You can start typing your message and receive responses from the AI model.
5.  **Model Selection:** You can choose from the available downloaded models within the chat view.

### 2. RAG Talk - Context-Aware Chat with Document Retrieval

The "RAG Talk" command enables you to have conversations grounded in your own documents. You can upload files, and the AI will use their content to provide more relevant and informed responses. This feature requires the backend server and database to be running, as well as the nomic-embed-text:latest Ollama model for generating document embeddings.

https://github.com/user-attachments/assets/e13a743f-12e5-40b9-ae29-8f74aa11c5ac

**Ollama Embedding Model:**

- nomic-embed-text:latest: This model is used by the "RAG Talk" functionality to create embeddings of your uploaded documents, allowing the AI to understand and retrieve information effectively. You can download it using Ollama in your terminal:

```bash
   ollama pull nomic-embed-text:latest
```

**Supported File Types for Document Upload:**

- `.json`
- `.jsonl`
- `.txt`
- `.ts` / `.tsx`
- `.js` / `.jsx`
- `.md`
- `.csv`
- `.docx`
- `.pptx`
- `.pdf`

**How to set up the backend server and database for RAG Talk:**

1.  **Navigate to the server directory:** Open your terminal and navigate to the `work-buddy-server` directory within your Work Buddy extension repository.
2.  **Run Docker Compose:** Execute the following command to start the server and the PostgreSQL database with the pgvector extension in detached mode:

```bash
docker-compose up -d
```

3.  **Verify the containers are running:** After running the command, ensure that the Docker containers for the server and the database are running correctly. You can check this using `docker ps` in your terminal. Look for containers related to your Work Buddy server and the PostgreSQL database.

**How to use RAG Talk:**

1.  Open the Raycast search panel by pressing `Command + Space`.
2.  Type `RAG Talk`. The Work Buddy extension item will appear.
3.  Press `Enter` to open the chat view.
4.  **File Management:** Before starting a RAG-based conversation, you need to upload your documents. Use the "File Management" view within the extension to add the files you want to use for context.
5.  Once your files are uploaded, you can start your conversation. The AI will now consider the content of your uploaded documents when generating responses.

## Development

If you want to contribute to or further develop the Work Buddy extension:

1.  Ensure you have Node.js installed (see Prerequisites).
2.  **Client-side Development:** Navigate to the `work-buddy-client` directory in your terminal.

```bash
cd work-buddy-client
npm install
```

You can then start the Raycast developer mode, which might automatically open the extension if configured, or use Raycast's developer tools to load the extension from your local directory. 3. **Server-side Development:** Navigate to the `work-buddy-server` directory in your terminal.

```bash
cd work-buddy-server
# You might have server-specific dependencies to install here
# For example: npm install or pnpm install
```

Refer to the `work-buddy-server`'s `package.json` or `pnpm-lock.yaml` for server-side development instructions and dependencies.

## Troubleshooting

- **Ollama not running:** Ensure that Ollama is running in the background before using the extension.
- **Models not found:** Double-check that you have downloaded the required Ollama models.
- **RAG Talk server issues:** If you encounter problems with "RAG Talk," verify that your Docker containers for the server and database are running without errors. Check the Docker logs for any specific issues.

```

```
