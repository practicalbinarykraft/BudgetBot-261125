import Anthropic from "@anthropic-ai/sdk";

/**
 * Analyze user spending patterns using AI
 * Responsibility: Process transactions and provide financial insights
 */
export async function analyzeSpending(
  transactions: any[],
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Anthropic API key is required for spending analysis");
  }

  const anthropic = new Anthropic({ apiKey });

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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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

/**
 * Scan receipt image and extract transaction data
 * Responsibility: OCR for basic receipt information
 */
export async function scanReceipt(
  imageBase64: string,
  apiKey: string
): Promise<{
  amount: number;
  description: string;
  category?: string;
  date?: string;
}> {
  if (!apiKey) {
    throw new Error("Anthropic API key is required for receipt scanning");
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
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

Return ONLY JSON, no markdown:
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
      // Remove markdown code blocks if present
      const cleanedText = content.text.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
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
