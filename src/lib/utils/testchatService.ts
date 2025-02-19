import axios from "axios";

export async function streamOllamaResponse(
  model: string = "deepseek-r1:1.5b",
  messages: Array<{ role: string; content: string }>,
  onData: (chunk: string) => void,
  onEnd: () => void,
) {
  if (!model || !messages || messages.length === 0) {
    throw new Error("Model and messages are required.");
  }

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

    response.data.on("data", (chunk: Buffer) => {
      const data = chunk.toString();
      const jsonResponse = JSON.parse(data);

      console.log("jsonResponse", jsonResponse);

      onData(jsonResponse.message.content);
    });

    response.data.on("end", () => {
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

// import axios, { AxiosResponse } from "axios";

// export async function streamOllamaResponse(
//   model: string = "deepseek-r1:1.5b",
//   chatName: string,
//   query: string,
//   onData: (chunk: string) => void,
//   onEnd: () => void,
// ) {
//   if (!model || !chatName || !query) {
//     throw new Error("Model, chatName, and query are required.");
//   }

//   try {
//     const response = await axios.post(
//       "http://localhost:11434/api/generate",
//       {
//         model: model,
//         prompt: query,
//         stream: true,
//       },
//       {
//         responseType: "stream",
//       },
//     );

//     response.data.on("data", (chunk: Buffer) => {
//       const data = chunk.toString();
//       const jsonResponse = JSON.parse(data);
//       onData(jsonResponse.response);
//     });

//     response.data.on("end", () => {
//       onEnd();
//     });

//     response.data.on("error", (err: Error) => {
//       console.error("Stream error:", err);
//     });
//   } catch (err) {
//     console.error("Failed to start Ollama process:", err);
//     throw err;
//   }
// }
