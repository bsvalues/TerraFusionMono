import { Router } from "express";
import mcpService from "../services/mcp";

const router = Router();

// POST /api/mcp/agent
router.post("/agent", mcpService);

export default router;
