import express from "express";
import {
  uploadDocument,
  deleteDocument,
} from "@/controllers/document.controller"; // Adjust the path if needed

const router = express.Router();

router.post("/upload", uploadDocument);
router.post("/delete", deleteDocument);

export default router;
