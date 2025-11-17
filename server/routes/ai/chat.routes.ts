import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { chatWithAI } from "../../services/ai/chat.service";
import { buildFinancialContext } from "../../services/ai/financial-context.service";

const router = Router();

// GET /api/ai/chat/history
router.get("/history", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: "Invalid limit. Must be between 1 and 100." 
      });
    }
    
    const messages = await storage.getAIChatMessages(userId, limit);
    res.json(messages);
  } catch (error: any) {
    console.error("Chat history error:", error);
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/chat
router.post("/", withAuth(async (req, res) => {
  try {
    const { message, includeContext = true } = req.body;
    const userId = req.user.id;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required" });
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    
    if (trimmedMessage.length > 4000) {
      return res.status(400).json({ 
        error: `Message too long (${trimmedMessage.length} characters). Maximum is 4000.` 
      });
    }
    
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    // Build financial context if requested
    let contextData: string | undefined;
    if (includeContext) {
      contextData = await buildFinancialContext({ userId });
    }
    
    // Get recent chat history
    const recentMessages = await storage.getAIChatMessages(userId, 10);
    const chatHistory = recentMessages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    
    // Add current user message (use trimmed version)
    chatHistory.push({ role: "user", content: trimmedMessage });
    
    // Call AI
    const aiResponse = await chatWithAI({
      messages: chatHistory,
      contextData,
      apiKey: anthropicApiKey
    });
    
    // Save both messages to DB (use trimmed version)
    await storage.createAIChatMessage({
      userId,
      role: "user",
      content: trimmedMessage
    });
    
    await storage.createAIChatMessage({
      userId,
      role: "assistant",
      content: aiResponse.message
    });
    
    res.json({
      success: true,
      message: aiResponse.message,
      usage: aiResponse.usage
    });
    
  } catch (error: any) {
    console.error("AI chat error:", error);
    res.status(500).json({
      error: "Failed to process chat",
      details: error.message || "Unknown error"
    });
  }
}));

export default router;
