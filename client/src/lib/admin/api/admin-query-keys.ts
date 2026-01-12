/**
 * Admin Query Keys
 *
 * Centralized query keys for TanStack Query
 * Junior-Friendly: Simple constants, easy to invalidate
 */

export const adminQueryKeys = {
  // Metrics
  heroMetrics: ['admin', 'metrics', 'hero'] as const,
  revenueMetrics: ['admin', 'metrics', 'revenue'] as const,
  growthMetrics: ['admin', 'metrics', 'growth'] as const,
  unitEconomics: ['admin', 'metrics', 'unit-economics'] as const,
  cohortRetention: ['admin', 'metrics', 'cohort-retention'] as const,

  // Users
  users: (params: { page?: number; limit?: number; search?: string; status?: string; plan?: string } = {}) =>
    ['admin', 'users', params] as const,
  user: (id: number) => ['admin', 'users', id] as const,
  userDetail: (id: string | number | undefined) => ['admin', 'users', id, 'detail'] as const,
  userTransactions: (userId: number) => ['admin', 'users', userId, 'transactions'] as const,
  userTimeline: (userId: number) => ['admin', 'users', userId, 'timeline'] as const,

  // System
  systemHealth: ['admin', 'system', 'health'] as const,

  // Analytics
  funnelAnalysis: ['admin', 'analytics', 'funnel'] as const,
  featureAdoption: ['admin', 'analytics', 'feature-adoption'] as const,
  userSegments: ['admin', 'analytics', 'segments'] as const,

  // Audit Log
  auditLogs: (params?: { limit?: number; offset?: number; userId?: number; action?: string; entityType?: string }) =>
    ['admin', 'audit-logs', params] as const,

  // Support
  supportChats: (params?: { page?: number; limit?: number; status?: string; priority?: string; unreadOnly?: boolean }) =>
    ['admin', 'support', 'chats', params] as const,
  supportChatMessages: (chatId: number, limit?: number) =>
    ['admin', 'support', 'chats', chatId, 'messages', limit] as const,

  // Broadcasts
  broadcasts: (params?: { page?: number; limit?: number; status?: string }) =>
    ['admin', 'broadcasts', params] as const,
  broadcastTemplates: ['admin', 'broadcasts', 'templates'] as const,
} as const;

