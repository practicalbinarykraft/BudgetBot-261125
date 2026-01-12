/**
 * Mock Support Data
 *
 * Support chats with users
 * Junior-Friendly: Simple structure
 */

export interface SupportChat {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userTelegram?: {
    id: string;
    username: string;
  };
  status: 'open' | 'waiting' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  lastMessage: {
    text: string;
    from: 'user' | 'admin';
    timestamp: Date;
  };
  unreadCount: number;
  messagesCount: number;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tags: string[];
}

export interface SupportMessage {
  id: number;
  chatId: number;
  from: 'user' | 'admin';
  fromName: string;
  text: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName?: string;
  }[];
  timestamp: Date;
  read: boolean;
}

// Generate mock support chats
function generateMockSupportChats(): SupportChat[] {
  const now = new Date();
  const chats: SupportChat[] = [];

  // Open high priority chat
  chats.push({
    id: 1,
    userId: 1,
    userName: 'Иван Иванов',
    userEmail: 'user1@example.com',
    userTelegram: {
      id: '100000001',
      username: 'user1_tg',
    },
    status: 'open',
    priority: 'high',
    subject: 'Payment issue - subscription not working',
    lastMessage: {
      text: 'I paid for Pro plan but still see Free plan. Please help!',
      from: 'user',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
    },
    unreadCount: 1,
    messagesCount: 5,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    tags: ['payment', 'subscription'],
  });

  // Waiting medium priority
  chats.push({
    id: 2,
    userId: 15,
    userName: 'Maria Petrov',
    userEmail: 'user15@example.com',
    status: 'waiting',
    priority: 'medium',
    subject: 'Question about OCR feature',
    lastMessage: {
      text: 'Thanks for the info! I\'ll try that.',
      from: 'admin',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    unreadCount: 0,
    messagesCount: 8,
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    assignedTo: 'Admin User',
    tags: ['feature', 'ocr'],
  });

  // Open urgent
  chats.push({
    id: 3,
    userId: 42,
    userName: 'Alex Smith',
    userEmail: 'user42@example.com',
    userTelegram: {
      id: '100000042',
      username: 'alex_smith',
    },
    status: 'open',
    priority: 'urgent',
    subject: 'Account locked - cannot login',
    lastMessage: {
      text: 'I keep getting error 403. Please unlock my account!',
      from: 'user',
      timestamp: new Date(now.getTime() - 10 * 60 * 1000),
    },
    unreadCount: 1,
    messagesCount: 3,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 10 * 60 * 1000),
    tags: ['account', 'security'],
  });

  // Closed
  chats.push({
    id: 4,
    userId: 78,
    userName: 'Jane Doe',
    userEmail: 'user78@example.com',
    status: 'closed',
    priority: 'low',
    subject: 'How to export transactions?',
    lastMessage: {
      text: 'Perfect! Thank you so much!',
      from: 'user',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    unreadCount: 0,
    messagesCount: 6,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    assignedTo: 'Admin User',
    tags: ['how-to'],
  });

  return chats;
}

// Generate mock messages for a chat
export function generateMockMessages(chatId: number): SupportMessage[] {
  const messages: SupportMessage[] = [];
  const now = new Date();

  if (chatId === 1) {
    messages.push({
      id: 1,
      chatId: 1,
      from: 'user',
      fromName: 'Иван Иванов',
      text: 'Hello! I have a problem with my subscription.',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
    });
    messages.push({
      id: 2,
      chatId: 1,
      from: 'admin',
      fromName: 'Admin User',
      text: 'Hi! I\'m here to help. What seems to be the issue?',
      timestamp: new Date(now.getTime() - 120 * 60 * 1000),
      read: true,
    });
    messages.push({
      id: 3,
      chatId: 1,
      from: 'user',
      fromName: 'Иван Иванов',
      text: 'I paid for Pro plan yesterday but I still see Free plan in my settings.',
      timestamp: new Date(now.getTime() - 90 * 60 * 1000),
      read: true,
    });
    messages.push({
      id: 4,
      chatId: 1,
      from: 'admin',
      fromName: 'Admin User',
      text: 'Let me check your payment status. Can you provide your payment ID or email used for payment?',
      timestamp: new Date(now.getTime() - 60 * 60 * 1000),
      read: true,
    });
    messages.push({
      id: 5,
      chatId: 1,
      from: 'user',
      fromName: 'Иван Иванов',
      text: 'I paid for Pro plan but still see Free plan. Please help!',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      read: false,
    });
  }

  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export const mockSupportChats: SupportChat[] = generateMockSupportChats();

