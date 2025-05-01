import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import "dotenv/config";

import chatRoutes from "@/routes/chat.routes";
import documentRoutes from "@/routes/document.routes";

const app = express();
const port = process.env.PORT;

// const upload = multer({ dest: "./uploads" });
const upload = multer({ storage: multer.memoryStorage() }); // Files will be stored in memory

app.use(bodyParser.json());

app.use("/api/rag", chatRoutes);

app.use("/api/documents", upload.single("file"), documentRoutes);

// @ts-expect-error This is fine
app.get("/", (req, res) => {
  res.send("Hello Buddy!");
});

// Start the server
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
