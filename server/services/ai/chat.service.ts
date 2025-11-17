import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatWithAIParams {
  messages: ChatMessage[];
  contextData?: string;
  apiKey: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Chat with AI financial advisor using Claude
 * Responsibility: Handle AI chat conversations with financial context
 */
export async function chatWithAI(params: ChatWithAIParams): Promise<ChatResponse> {
  const { messages, contextData, apiKey } = params;
  
  if (!apiKey) {
    throw new Error("Anthropic API key is required for AI chat");
  }
  
  if (!messages || messages.length === 0) {
    throw new Error("Messages array cannot be empty");
  }

  // Validate message content length (Anthropic has limits)
  const MAX_MESSAGE_LENGTH = 4000;
  for (const msg of messages) {
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (${msg.content.length} characters). Maximum is ${MAX_MESSAGE_LENGTH}.`);
    }
  }

  const anthropic = new Anthropic({ apiKey });

  // Build system prompt with financial context
  const systemPrompt = buildSystemPrompt(contextData);

  // Convert messages to Anthropic format (content must be array of content blocks)
  const anthropicMessages = messages.map(msg => ({
    role: msg.role,
    content: [{ type: "text" as const, text: msg.content }]
  }));

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Unexpected response format from AI");
    }

    return {
      message: firstBlock.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error: any) {
    console.error("AI chat error:", error);
    
    if (error.status === 401) {
      throw new Error("Invalid Anthropic API key. Please check your settings.");
    }
    
    if (error.status === 400) {
      throw new Error("Invalid request format. Please try a shorter message or contact support.");
    }
    
    if (error.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw new Error(`Failed to chat with AI: ${error.message}`);
  }
}

/**
 * Build system prompt for financial advisor AI
 */
function buildSystemPrompt(contextData?: string): string {
  const basePrompt = `You are a helpful personal finance advisor. Your role is to:

1. Provide practical, actionable financial advice
2. Help users understand their spending patterns
3. Suggest ways to save money and achieve financial goals
4. Explain financial concepts in simple, everyday language
5. Be supportive and encouraging about financial progress

Guidelines:
- Keep responses concise (2-4 sentences unless asked for details)
- Use friendly, conversational tone
- Focus on actionable steps
- Avoid jargon unless explaining a concept
- Be realistic about financial situations`;

  if (contextData) {
    return `${basePrompt}\n\n=== User's Financial Context ===\n${contextData}\n\nUse this context to provide personalized advice.`;
  }

  return basePrompt;
}

/**
 * Save chat message to database
 */
export async function saveChatMessage(params: {
  userId: number;
  role: "user" | "assistant";
  content: string;
  contextType?: string;
  contextData?: string;
}): Promise<number> {
  const { storage } = await import("../../storage");
  
  const messageId = await storage.createAIChatMessage({
    userId: params.userId,
    role: params.role,
    content: params.content,
    contextType: params.contextType,
    contextData: params.contextData
  });

  return messageId;
}

/**
 * Get chat history for user
 */
export async function getChatHistory(
  userId: number,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { storage } = await import("../../storage");
  
  const messages = await storage.getAIChatMessages(userId, limit);
  
  return messages.map(msg => ({
    role: msg.role as "user" | "assistant",
    content: msg.content
  }));
}
