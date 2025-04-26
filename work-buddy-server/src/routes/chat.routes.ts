import { Router } from "express";

import { ragChat } from "@/controllers/chat.controller";

const router = Router();

router.post("/stream", ragChat);

export default router;
