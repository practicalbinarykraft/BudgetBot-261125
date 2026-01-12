/**
 * Mock Broadcasts Data
 *
 * Templates and broadcast history
 * Junior-Friendly: Simple structure
 */

export interface BroadcastTemplate {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'subscription_ends_3_days' | 'subscription_ends_1_day' | 'subscription_expired' | 'inactive_7_days' | 'inactive_30_days' | 'first_transaction' | 'no_transactions_7_days';
  message: string;
  variables: string[]; // Available variables like {{userName}}, {{planName}}, etc.
}

export interface Broadcast {
  id: number;
  name: string;
  templateId?: string;
  message: string;
  filters: {
    status?: string[];
    plan?: string[];
    stage?: string[];
    tags?: string[];
    lastActiveDays?: number;
    hasTransactions?: boolean;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  createdAt: Date;
  createdBy: string;
}

export const broadcastTemplates: BroadcastTemplate[] = [
  {
    id: 'subscription_ends_3_days',
    name: 'Subscription ends in 3 days',
    description: 'Reminder sent 3 days before subscription expires',
    trigger: 'subscription_ends_3_days',
    message: `Hi {{userName}}! 👋

Your {{planName}} subscription will expire in 3 days.

Don't lose access to your financial insights! Renew now:
🔗 https://budgetbot.app/app/settings/billing

Questions? Reply to this message!`,
    variables: ['userName', 'planName', 'daysRemaining'],
  },
  {
    id: 'subscription_ends_1_day',
    name: 'Subscription ends tomorrow',
    description: 'Last reminder sent 1 day before subscription expires',
    trigger: 'subscription_ends_1_day',
    message: `⏰ Last chance, {{userName}}!

Your {{planName}} subscription expires TOMORROW.

Renew now to continue tracking your finances:
🔗 https://budgetbot.app/app/settings/billing

Special offer: Use code RENEW10 for 10% off!`,
    variables: ['userName', 'planName'],
  },
  {
    id: 'subscription_expired',
    name: 'Subscription expired',
    description: 'Sent when subscription has expired',
    trigger: 'subscription_expired',
    message: `Hi {{userName}},

Your {{planName}} subscription has expired. 😔

Your data is safe! Renew anytime to restore access:
🔗 https://budgetbot.app/app/settings/billing

We'd love to have you back! 💙`,
    variables: ['userName', 'planName'],
  },
  {
    id: 'inactive_7_days',
    name: 'Inactive for 7 days',
    description: 'Re-engagement message for users inactive for a week',
    trigger: 'inactive_7_days',
    message: `Hey {{userName}}! 👋

We noticed you haven't used BudgetBot in a while.

Quick check-in: Everything okay? We're here if you need help!

💡 Tip: Track your daily expenses in just 30 seconds via Telegram!`,
    variables: ['userName', 'lastActiveDate'],
  },
  {
    id: 'inactive_30_days',
    name: 'Inactive for 30 days',
    description: 'Re-engagement for long inactive users',
    trigger: 'inactive_30_days',
    message: `Hi {{userName}},

It's been a while! We miss you! 💙

Your financial data is waiting. Come back and see your spending insights:
🔗 https://budgetbot.app/app/dashboard

New features since you left:
✨ Improved AI chat
✨ Better receipt scanning
✨ New analytics dashboard`,
    variables: ['userName'],
  },
  {
    id: 'first_transaction',
    name: 'First transaction',
    description: 'Welcome message after first transaction',
    trigger: 'first_transaction',
    message: `🎉 Congratulations, {{userName}}!

You've created your first transaction. You're on your way to better financial health!

💡 Pro tip: Use /scan command to add expenses from receipts automatically.

Need help? Just ask me anything!`,
    variables: ['userName'],
  },
  {
    id: 'no_transactions_7_days',
    name: 'No transactions in 7 days',
    description: 'Reminder for users who signed up but haven\'t created transactions',
    trigger: 'no_transactions_7_days',
    message: `Hi {{userName}}! 👋

Get started with BudgetBot! Track your first expense:

1. Send me a photo of your receipt: 📸
2. Or type: /add 50 coffee

It takes just 30 seconds! Let's start tracking your finances together! 💪`,
    variables: ['userName'],
  },
];

// Generate mock broadcast history
function generateMockBroadcasts(): Broadcast[] {
  const now = new Date();
  const broadcasts: Broadcast[] = [];

  // Past broadcasts
  broadcasts.push({
    id: 1,
    name: 'Welcome to Pro Plan',
    templateId: 'subscription_ends_3_days',
    message: 'Hi! Welcome to Pro Plan...',
    filters: {
      plan: ['pro'],
    },
    status: 'completed',
    sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    sentCount: 45,
    failedCount: 2,
    totalRecipients: 47,
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    createdBy: 'Admin User',
  });

  broadcasts.push({
    id: 2,
    name: 'Inactive Users Re-engagement',
    templateId: 'inactive_30_days',
    message: 'Hey! We noticed...',
    filters: {
      lastActiveDays: 30,
      hasTransactions: true,
    },
    status: 'completed',
    sentAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    sentCount: 123,
    failedCount: 5,
    totalRecipients: 128,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    createdBy: 'Admin User',
  });

  // Scheduled broadcast
  broadcasts.push({
    id: 3,
    name: 'New Feature Announcement',
    message: 'Check out our new feature...',
    filters: {
      status: ['active'],
    },
    status: 'scheduled',
    scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    sentCount: 0,
    failedCount: 0,
    totalRecipients: 156,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    createdBy: 'Admin User',
  });

  // Draft
  broadcasts.push({
    id: 4,
    name: 'Draft: Holiday Promotion',
    message: 'Special holiday offer...',
    filters: {},
    status: 'draft',
    sentCount: 0,
    failedCount: 0,
    totalRecipients: 0,
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    createdBy: 'Admin User',
  });

  return broadcasts;
}

export const mockBroadcasts: Broadcast[] = generateMockBroadcasts();

