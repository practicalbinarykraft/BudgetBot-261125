// Transaction Tool Handler - add new income or expense transaction
import { storage } from '../../storage';
import { trainCategory } from '../../services/categorization.service';
import { ToolResult } from '../tool-types';

export async function handleAddTransaction(
  userId: number,
  params: {
    amount: number;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    personal_tag?: string;
    date?: string;
    currency?: string;
  }
): Promise<ToolResult> {
  try {
    // Validate required params
    if (!params.amount || !params.description || !params.type) {
      return {
        success: false,
        error: 'Missing required parameters: amount, description, and type'
      };
    }

    // Get primary wallet for this user (needed for walletId)
    const wallets = await storage.getWalletsByUserId(userId);
    const primaryWallet = wallets.find(w => w.isPrimary === 1) || wallets[0];

    const currency = params.currency || 'USD';
    const amount = params.amount;
    
    // Resolve personal tag name to ID if provided (case-insensitive)
    let personalTagId: number | undefined = undefined;
    if (params.personal_tag) {
      const tags = await storage.getPersonalTagsByUserId(userId);
      const matchedTag = tags.find(t => 
        t.name.toLowerCase() === params.personal_tag!.toLowerCase()
      );
      personalTagId = matchedTag?.id;
    }
    
    // Create transaction
    const transaction = await storage.createTransaction({
      userId,
      amount: amount.toString(),
      amountUsd: amount.toString(), // Simplified: assume USD or convert later
      description: params.description,
      category: params.category,
      personalTagId, // Will be set via frontend dropdown
      type: params.type,
      date: params.date || new Date().toISOString().split('T')[0],
      currency,
      source: 'manual', // AI-created transactions marked as manual
      walletId: primaryWallet?.id
    });
    
    // Train ML model if category was provided
    if (params.category) {
      await trainCategory(userId, params.description, params.category);
    }
    
    return {
      success: true,
      data: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date,
        currency: transaction.currency
      },
      message: `${params.type === 'income' ? 'Income' : 'Expense'} of $${amount} added: ${params.description}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add transaction'
    };
  }
}
