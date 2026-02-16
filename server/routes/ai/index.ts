import { Router } from "express";
import { ZodError } from "zod";
import chatRoutes from "./chat.routes";
import trainingRoutes from "./training.routes";
import analyzeRoutes from "./analyze.routes";
import receiptsRoutes from "./receipts.routes";
import priceRoutes from "./price.routes";
import voiceParseRoutes from "./voice-parse.routes";
import { withAuth } from "../../middleware/auth-utils";
import { executeTool } from "../../ai/tool-executor";
import { type ToolName } from "../../ai/tool-types";
import { ANTHROPIC_TOOLS } from "../../ai/tools";
import { validateToolParams } from "../../ai/tool-schemas";
import { storage } from "../../storage";
import { aiRateLimiter } from "../../middleware/rate-limit";
import { logInfo, logError } from '../../lib/logger';
import { getErrorMessage } from "../../lib/errors";

const router = Router();

// Apply rate limiting to all AI routes
router.use(aiRateLimiter);

// POST /api/ai/confirm-tool - execute confirmed tool action
router.post("/confirm-tool", withAuth(async (req, res) => {
  try {
    logInfo('/api/ai/confirm-tool called');
    logInfo('Request body', { body: req.body });
    logInfo('User ID', { userId: req.user?.id });
    
    const { action, params } = req.body;
    const userId = Number(req.user.id);

    if (!action || typeof action !== 'string') {
      logError('❌ No action provided');
      return res.status(400).json({ error: "Action is required" });
    }
    
    if (!params || typeof params !== 'object') {
      logError('❌ No params provided');
      return res.status(400).json({ error: "Params are required" });
    }
    
    // Verify the tool exists
    const tool = ANTHROPIC_TOOLS.find(t => t.name === action);
    if (!tool) {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    
    // Validate params with Zod schema (full type/constraint checking)
    logInfo('Validating params for action', { action });
    let validatedParams;
    try {
      validatedParams = validateToolParams(action, params);
      logInfo('✅ Params validated:', validatedParams);
    } catch (error) {
      logError('❌ Validation failed:', error);
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
    logInfo('Executing tool', { action });
    const result = await executeTool(action as ToolName, validatedParams, userId);
    logInfo('📊 Tool result:', { success: result.success, error: result.error });
    
    if (!result.success) {
      logError('❌ Tool execution failed:', result.error);
      return res.status(400).json({ 
        error: result.error || 'Failed to execute action'
      });
    }
    
    // Save action confirmation to chat history
    const confirmationMessage = result.message || 
      `Action completed: ${action} with ${JSON.stringify(result.data)}`;
    
    logInfo('💾 Saving to chat history');
    await storage.createAIChatMessage({
      userId,
      role: "assistant",
      content: confirmationMessage
    });
    
    logInfo('✅ Returning success response');
    return res.json({
      success: true,
      message: confirmationMessage,
      data: result.data
    });
    
  } catch (error: unknown) {
    logError("💥 ERROR in /api/ai/confirm-tool:", error);
    if (error instanceof Error) {
      logError("Stack trace:", error.stack);
    }
    return res.status(500).json({
      error: "Failed to execute action",
      details: getErrorMessage(error)
    });
  }
}));

// Mount sub-routers
router.use("/chat", chatRoutes);
router.use("/", trainingRoutes);
router.use("/", analyzeRoutes);
router.use("/", receiptsRoutes);
router.use("/", priceRoutes);
router.use("/", voiceParseRoutes);

export default router;
