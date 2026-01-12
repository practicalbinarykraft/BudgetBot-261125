/**
 * Mock Transactions Data
 *
 * Realistic mock data for user transactions
 * Junior-Friendly: Simple array structure
 */

export interface MockTransaction {
  id: number;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  source: 'manual' | 'telegram' | 'ocr';
  hasAttachment: boolean;
}

export interface MockUserTransactions {
  userId: number;
  transactions: MockTransaction[];
  total: number;
}

// Generate mock transactions for a user
export function generateMockTransactions(userId: number, count: number = 50): MockTransaction[] {
  const categories = [
    'Еда', 'Транспорт', 'Развлечения', 'Здоровье', 'Одежда',
    'Зарплата', 'Подарки', 'Учеба', 'Дом', 'Другое',
  ];

  const descriptions = [
    'Покупка продуктов', 'Такси', 'Кино', 'Врач', 'Одежда',
    'Зарплата', 'Подарок', 'Курсы', 'Ремонт', 'Кафе',
  ];

  const transactions: MockTransaction[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const type: 'income' | 'expense' = Math.random() > 0.1 ? 'expense' : 'income';
    const amount = type === 'income' 
      ? Math.floor(Math.random() * 5000) + 1000 // 1000-6000
      : Math.floor(Math.random() * 500) + 10; // 10-510

    const category = categories[Math.floor(Math.random() * categories.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    transactions.push({
      id: userId * 1000 + i,
      date,
      type,
      amount,
      currency: 'USD',
      description,
      category,
      source: Math.random() > 0.5 ? 'manual' : Math.random() > 0.5 ? 'telegram' : 'ocr',
      hasAttachment: Math.random() > 0.7, // 30% have attachments
    });
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

