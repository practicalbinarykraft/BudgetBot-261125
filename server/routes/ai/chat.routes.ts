import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { chatWithAI } from "../../services/ai/chat.service";
import { buildFinancialContext } from "../../services/ai/financial-context.service";
import { chatWithTools } from "../../ai/chat-with-tools";
import { ANTHROPIC_TOOLS, requiresConfirmation } from "../../ai/tools";
import { executeTool } from "../../ai/tool-executor";
import type { ToolName } from "../../ai/tool-types";
import { suggestCategory, getUserCategories } from "../../services/categorization.service";
import { validateToolParams } from "../../ai/tool-schemas";
import { ZodError } from "zod";
import { getErrorMessage } from "../../lib/errors";
import { checkCreditsAvailable, deductMessage, getCreditBalance } from "../../services/credits.service";
import { chatWithOpenRouter, buildFinancialAdvisorPrompt } from "../../services/ai/openrouter.service";

const router = Router();

// GET /api/ai/chat/balance
router.get("/balance", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const balance = await getCreditBalance(userId);

    res.json({
      messagesRemaining: balance.messagesRemaining,
      totalGranted: balance.totalGranted,
      totalUsed: balance.totalUsed
    });
  } catch (error: unknown) {
    console.error("Balance check error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/ai/chat/history
router.get("/history", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: "Invalid limit. Must be between 1 and 100." 
      });
    }
    
    const messages = await storage.getAIChatMessages(userId, limit);
    res.json(messages);
  } catch (error: unknown) {
    console.error("Chat history error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/ai/chat (with tool calling support)
router.post("/", withAuth(async (req, res) => {
  try {
    const { message } = req.body;
    const userId = Number(req.user.id);
    
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
    
    // 🔐 Get decrypted API key (optional - use OpenRouter if not set)
    const { settingsRepository } = await import('../../repositories/settings.repository');
    const apiKey = await settingsRepository.getAnthropicApiKey(userId);

    const useOpenRouter = !apiKey;

    // Check credits if using free OpenRouter
    if (useOpenRouter) {
      try {
        await checkCreditsAvailable(userId);
      } catch (error: any) {
        return res.status(402).json({
          error: error.message,
          creditsExhausted: true
        });
      }
    }

    // Save user message to history first
    await storage.createAIChatMessage({
      userId,
      role: "user",
      content: trimmedMessage
    });

    // Use OpenRouter (free, no tools) or Anthropic (paid, with tools)
    if (useOpenRouter) {
      // Get recent chat history for context
      const recentMessages = await storage.getAIChatMessages(userId, 10);
      const messages = recentMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })).reverse();

      // Build system prompt with financial context
      const contextData = await buildFinancialContext(userId);
      const systemPrompt = buildFinancialAdvisorPrompt(contextData);

      // Call OpenRouter with DeepSeek
      const openRouterMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages
      ];

      const response = await chatWithOpenRouter({
        messages: openRouterMessages,
        model: "deepseek/deepseek-chat"
      });

      // Save assistant message
      await storage.createAIChatMessage({
        userId,
        role: "assistant",
        content: response.message
      });

      // Deduct one message from user's balance
      const newBalance = await deductMessage(userId, {
        model: "deepseek/deepseek-chat",
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        messageCount: 1
      });

      return res.json({
        type: 'message',
        content: response.message,
        creditsRemaining: newBalance.messagesRemaining
      });
    }

    // Call Claude with tools enabled (user has their own API key)
    const response = await chatWithTools(trimmedMessage, userId);
    
    // Check if Claude wants to use a tool
    const toolUse = response.content.find((block: any) => block.type === 'tool_use') as any;
    
    if (toolUse) {
      // Verify tool exists in our definitions
      const toolExists = ANTHROPIC_TOOLS.find(t => t.name === toolUse.name);
      
      if (!toolExists) {
        return res.status(500).json({ error: `Unknown tool: ${toolUse.name}` });
      }
      
      // CHECK: Does this tool require confirmation?
      if (!requiresConfirmation(toolUse.name)) {
        // READ operation - execute immediately
        const result = await executeTool(
          toolUse.name as ToolName, 
          toolUse.input, 
          userId
        );
        
        if (!result.success) {
          const errorMsg = `Failed to execute action: ${result.error}`;
          await storage.createAIChatMessage({
            userId,
            role: "assistant",
            content: errorMsg
          });
          return res.json({
            type: 'message',
            content: errorMsg
          });
        }
        
        // Save success message
        const successMsg = result.message || `Action completed: ${JSON.stringify(result.data)}`;
        await storage.createAIChatMessage({
          userId,
          role: "assistant",
          content: successMsg
        });
        
        return res.json({
          type: 'message',
          content: successMsg
        });
      }
      
      // WRITE operation - request confirmation (don't save to history yet)
      
      // ML auto-categorization for add_transaction
      let enhancedParams = toolUse.input;
      let mlSuggestion = null;
      let availableCategories = null;
      
      if (toolUse.name === 'add_transaction') {
        // Get user categories for dropdown
        availableCategories = await getUserCategories(userId);
        
        // Ensure category field always exists (even if empty) for dropdown rendering
        if (!enhancedParams.category) {
          enhancedParams = {
            ...enhancedParams,
            category: '' // Empty string ensures Object.entries() includes it
          };
        }
        
        // Try ML suggestion if category not provided by AI
        if (!toolUse.input.category && enhancedParams.description) {
          mlSuggestion = await suggestCategory(userId, enhancedParams.description);
          
          // Apply ML suggestion if confident enough
          if (mlSuggestion && mlSuggestion.confidence >= 0.6) {
            enhancedParams.category = mlSuggestion.categoryName;
          }
        }
      }
      
      return res.json({
        type: 'tool_confirmation',
        action: toolUse.name,
        params: enhancedParams,
        toolUseId: toolUse.id,
        mlSuggestion, // ML category suggestion with confidence
        availableCategories // All user categories for dropdown
      });
    }
    
    // No tool use - return regular text response
    const textContent: any = response.content.find((block: any) => block.type === 'text');
    const aiMessage = textContent?.text || 'No response';
    
    // Save assistant message to DB (user message already saved above)
    await storage.createAIChatMessage({
      userId,
      role: "assistant",
      content: aiMessage
    });
    
    return res.json({
      type: 'message',
      content: aiMessage
    });
    
  } catch (error: unknown) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      error: "Failed to process chat",
      details: getErrorMessage(error)
    });
  }
}));

export default router;
