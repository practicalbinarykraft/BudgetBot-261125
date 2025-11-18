import { Router } from "express";
import { ZodError } from "zod";
import chatRoutes from "./chat.routes";
import trainingRoutes from "./training.routes";
import analyzeRoutes from "./analyze.routes";
import receiptsRoutes from "./receipts.routes";
import priceRoutes from "./price.routes";
import { withAuth } from "../../middleware/auth-utils";
import { executeTool } from "../../ai/tool-executor";
import { type ToolName } from "../../ai/tool-types";
import { ANTHROPIC_TOOLS } from "../../ai/tools";
import { validateToolParams } from "../../ai/tool-schemas";
import { storage } from "../../storage";

const router = Router();

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

// Mount sub-routers
router.use("/chat", chatRoutes);
router.use("/", trainingRoutes);
router.use("/", analyzeRoutes);
router.use("/", receiptsRoutes);
router.use("/", priceRoutes);

export default router;
