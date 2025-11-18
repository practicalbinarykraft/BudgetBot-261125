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

// POST /api/ai/chat (with tool calling support)
router.post("/", withAuth(async (req, res) => {
  try {
    const { message } = req.body;
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
    if (!settings?.anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    // Save user message to history first
    await storage.createAIChatMessage({
      userId,
      role: "user",
      content: trimmedMessage
    });
    
    // Call Claude with tools enabled
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
    
  } catch (error: any) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      error: "Failed to process chat",
      details: error.message || "Unknown error"
    });
  }
}));

// POST /api/ai/confirm-tool - execute confirmed tool action
router.post("/confirm-tool", withAuth(async (req, res) => {
  try {
    console.log('🔧 /api/ai/confirm-tool called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user?.id);
    
    const { action, params } = req.body;
    const userId = req.user.id;
    
    if (!action || typeof action !== 'string') {
      console.error('❌ No action provided');
      return res.status(400).json({ error: "Action is required" });
    }
    
    if (!params || typeof params !== 'object') {
      console.error('❌ No params provided');
      return res.status(400).json({ error: "Params are required" });
    }
    
    // Verify the tool exists
    const tool = ANTHROPIC_TOOLS.find(t => t.name === action);
    if (!tool) {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    
    // Validate params with Zod schema (full type/constraint checking)
    console.log('🔍 Validating params for action:', action);
    let validatedParams;
    try {
      validatedParams = validateToolParams(action, params);
      console.log('✅ Params validated:', validatedParams);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Invalid parameters',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      return res.status(400).json({ 
        error: 'Parameter validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Execute the tool with validated params
    console.log('⚙️ Executing tool:', action);
    const result = await executeTool(action as ToolName, validatedParams, userId);
    console.log('📊 Tool result:', { success: result.success, error: result.error });
    
    if (!result.success) {
      console.error('❌ Tool execution failed:', result.error);
      return res.status(400).json({ 
        error: result.error || 'Failed to execute action'
      });
    }
    
    // Save action confirmation to chat history
    const confirmationMessage = result.message || 
      `Action completed: ${action} with ${JSON.stringify(result.data)}`;
    
    console.log('💾 Saving to chat history');
    await storage.createAIChatMessage({
      userId,
      role: "assistant",
      content: confirmationMessage
    });
    
    console.log('✅ Returning success response');
    return res.json({
      success: true,
      message: confirmationMessage,
      data: result.data
    });
    
  } catch (error: any) {
    console.error("💥 ERROR in /api/ai/confirm-tool:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({
      error: "Failed to execute action",
      details: error.message || "Unknown error"
    });
  }
}));

export default router;
