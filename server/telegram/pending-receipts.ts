import { randomBytes } from 'crypto';

interface PendingReceipt {
  parsed: {
    amount: number;
    currency: string;
    description: string;
    category: string;
    type: 'expense' | 'income';
  };
  categoryId: number | null;
  userId: number;
  expiresAt: number;
}

class PendingReceiptsStore {
  private receipts: Map<string, PendingReceipt> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  generateId(): string {
    return randomBytes(8).toString('hex');
  }

  store(data: Omit<PendingReceipt, 'expiresAt'>): string {
    const id = this.generateId();
    const expiresAt = Date.now() + this.TTL;
    
    this.receipts.set(id, { ...data, expiresAt });
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      this.receipts.delete(id);
    }, this.TTL);
    
    return id;
  }

  get(id: string): PendingReceipt | null {
    const receipt = this.receipts.get(id);
    
    if (!receipt) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > receipt.expiresAt) {
      this.receipts.delete(id);
      return null;
    }
    
    return receipt;
  }

  delete(id: string): void {
    this.receipts.delete(id);
  }
}

export const pendingReceipts = new PendingReceiptsStore();
