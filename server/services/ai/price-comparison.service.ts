import Anthropic from "@anthropic-ai/sdk";
import { ReceiptItem } from "@shared/schema";

export interface PriceRecommendation {
  itemName: string;
  normalizedName: string;
  currentMerchant: string;
  currentPrice: number;
  bestPrice: number;
  bestMerchant: string;
  savings: number;
  savingsPercent: number;
}

export interface PriceComparisonResult {
  recommendations: PriceRecommendation[];
  totalPotentialSavings: number;
  averageSavingsPercent: number;
}

export async function comparePrices(
  items: ReceiptItem[]
): Promise<PriceComparisonResult> {
  if (!items || items.length === 0) {
    return {
      recommendations: [],
      totalPotentialSavings: 0,
      averageSavingsPercent: 0
    };
  }

  const groupedByNormalizedName = groupItemsByNormalizedName(items);
  
  const recommendations: PriceRecommendation[] = [];
  let totalPotentialSavings = 0;

  for (const [normalizedName, itemGroup] of Object.entries(groupedByNormalizedName)) {
    if (itemGroup.length < 2) continue;

    const sortedByPrice = itemGroup.sort((a, b) => {
      const priceA = Number(a.pricePerUnit) || 0;
      const priceB = Number(b.pricePerUnit) || 0;
      return priceA - priceB;
    });

    const bestPrice = Number(sortedByPrice[0].pricePerUnit) || 0;
    const bestMerchant = sortedByPrice[0].merchantName || 'Unknown';

    for (let i = 1; i < sortedByPrice.length; i++) {
      const item = sortedByPrice[i];
      const currentPrice = Number(item.pricePerUnit) || 0;
      
      if (currentPrice > bestPrice) {
        const savings = currentPrice - bestPrice;
        const savingsPercent = bestPrice > 0 
          ? ((savings / currentPrice) * 100) 
          : 0;

        recommendations.push({
          itemName: item.itemName || normalizedName,
          normalizedName,
          currentMerchant: item.merchantName || 'Unknown',
          currentPrice,
          bestPrice,
          bestMerchant,
          savings,
          savingsPercent
        });

        totalPotentialSavings += savings;
      }
    }
  }

  const averageSavingsPercent = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.savingsPercent, 0) / recommendations.length
    : 0;

  return {
    recommendations: recommendations.sort((a, b) => b.savings - a.savings),
    totalPotentialSavings,
    averageSavingsPercent
  };
}

function groupItemsByNormalizedName(items: ReceiptItem[]): Record<string, ReceiptItem[]> {
  const grouped: Record<string, ReceiptItem[]> = {};
  
  for (const item of items) {
    const key = item.normalizedName || item.itemName || 'unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }
  
  return grouped;
}

export async function getAIPriceInsights(
  recommendations: PriceRecommendation[],
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Anthropic API key is required");
  }

  if (recommendations.length === 0) {
    return "No price comparison data available yet. Scan more receipts from different merchants to discover potential savings!";
  }

  const anthropic = new Anthropic({ apiKey });

  const topRecommendations = recommendations.slice(0, 5);
  const recommendationsText = topRecommendations
    .map(r => 
      `- ${r.itemName}: ${r.currentPrice} at ${r.currentMerchant} vs ${r.bestPrice} at ${r.bestMerchant} (save ${r.savings.toFixed(2)} / ${r.savingsPercent.toFixed(1)}%)`
    )
    .join('\n');

  const prompt = `You are a helpful shopping advisor. Based on the following price comparisons across different merchants, provide 2-3 actionable shopping tips to help the user save money. Keep it friendly and concise (3-4 sentences max).

Price Comparisons:
${recommendationsText}

Total potential savings: ${recommendations.reduce((sum, r) => sum + r.savings, 0).toFixed(2)}

Provide practical advice about where to shop and what to watch out for.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const firstBlock = message.content[0];
    if (firstBlock && firstBlock.type === "text") {
      return firstBlock.text;
    }

    return "Unable to generate price insights at this time.";
  } catch (error: any) {
    console.error("AI price insights error:", error);
    throw new Error(`Failed to generate AI insights: ${error.message}`);
  }
}
