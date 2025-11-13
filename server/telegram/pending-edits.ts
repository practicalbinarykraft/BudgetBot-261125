interface PendingEdit {
  transactionId: number;
  userId: number;
  oldTransaction: {
    amount: string;
    amountUsd: string;
    currency: string;
    type: 'income' | 'expense';
    walletId: number | null;
    originalAmount: string;
    exchangeRate: string;
  };
  chatId: number;
  messageId: number;
  expiresAt: number;
}

class PendingEditsStore {
  private edits: Map<string, PendingEdit> = new Map();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  store(telegramId: string, data: Omit<PendingEdit, 'expiresAt'>): void {
    const expiresAt = Date.now() + this.TTL;
    
    this.edits.set(telegramId, { ...data, expiresAt });
    
    setTimeout(() => {
      this.edits.delete(telegramId);
    }, this.TTL);
  }

  get(telegramId: string): PendingEdit | null {
    const edit = this.edits.get(telegramId);
    
    if (!edit) {
      return null;
    }
    
    if (Date.now() > edit.expiresAt) {
      this.edits.delete(telegramId);
      return null;
    }
    
    return edit;
  }

  delete(telegramId: string): void {
    this.edits.delete(telegramId);
  }
}

export const pendingEdits = new PendingEditsStore();
