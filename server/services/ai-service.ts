import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export async function analyzeSpending(transactions: any[]): Promise<string> {
  const client = getAnthropicClient();
  
  if (!client) {
    throw new Error("Anthropic API key not configured. Please add your API key in your Replit profile settings.");
  }

  const transactionsSummary = transactions.map((t) => ({
    date: t.date,
    type: t.type,
    amount: t.amountUsd,
    description: t.description,
    category: t.category,
  }));

  const prompt = `Analyze the following financial transactions and provide insights:

${JSON.stringify(transactionsSummary, null, 2)}

Please provide:
1. Overall spending patterns
2. Top spending categories
3. Recommendations for saving money
4. Any unusual spending patterns
5. Budget suggestions

Keep the response concise and actionable.`;

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return content.text;
    }

    return "Unable to analyze spending at this time.";
  } catch (error: any) {
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

export async function scanReceipt(imageBase64: string): Promise<{
  amount: number;
  description: string;
  category?: string;
  date?: string;
}> {
  const client = getAnthropicClient();
  
  if (!client) {
    throw new Error("Anthropic API key not configured. Please add your API key in your Replit profile settings.");
  }

  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Extract the following information from this receipt:
1. Total amount (just the number)
2. Merchant/store name
3. Date (in YYYY-MM-DD format if available)
4. Category (e.g., groceries, dining, shopping, etc.)

Respond in JSON format:
{
  "amount": <number>,
  "description": "<merchant name>",
  "category": "<category>",
  "date": "<YYYY-MM-DD or null>"
}`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const parsed = JSON.parse(content.text);
      return {
        amount: parsed.amount || 0,
        description: parsed.description || "Receipt scan",
        category: parsed.category,
        date: parsed.date,
      };
    }

    throw new Error("Unable to parse receipt");
  } catch (error: any) {
    throw new Error(`Receipt scanning failed: ${error.message}`);
  }
}
