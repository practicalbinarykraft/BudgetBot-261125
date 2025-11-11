import { getSuggestedCategory, learnCategory } from '../services/ml-categories';

export async function applyMLCategory(
  userId: number,
  transactionData: {
    description: string;
    category?: string;
  }
): Promise<{
  description: string;
  category: string | undefined;
  mlSuggested: boolean;
  mlConfidence: number;
}> {
  if (transactionData.category) {
    return {
      description: transactionData.description,
      category: transactionData.category,
      mlSuggested: false,
      mlConfidence: 0
    };
  }
  
  const suggestion = await getSuggestedCategory(
    userId,
    transactionData.description
  );
  
  if (suggestion) {
    const shouldApply = suggestion.confidence >= 0.7;
    
    return {
      description: transactionData.description,
      category: shouldApply ? suggestion.category : undefined,
      mlSuggested: shouldApply,
      mlConfidence: suggestion.confidence
    };
  }
  
  return {
    description: transactionData.description,
    category: undefined,
    mlSuggested: false,
    mlConfidence: 0
  };
}

export async function trainMLCategory(
  userId: number,
  transactionData: {
    description: string;
    category?: string;
  }
): Promise<void> {
  if (transactionData.category) {
    await learnCategory(
      userId,
      transactionData.description,
      transactionData.category
    );
  }
}
