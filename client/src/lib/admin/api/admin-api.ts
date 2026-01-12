/**
 * Admin API Client
 *
 * API client for admin panel with mock/real API switching
 * Junior-Friendly: Simple functions, clear structure
 */

import { mockUsers, type MockUser } from '../mock-data/users.mock';
import { mockHeroMetrics, mockRevenueMetrics, mockGrowthMetrics } from '../mock-data/metrics.mock';
import { generateMockTransactions, type MockTransaction } from '../mock-data/transactions.mock';
import { mockSystemHealth } from '../mock-data/system-health.mock';
import { mockFunnelData, mockFeatureAdoption, mockUserSegments } from '../mock-data/analytics.mock';
import { mockAuditLogs, type MockAuditLog } from '../mock-data/audit-log.mock';
import { mockBroadcasts, broadcastTemplates, type Broadcast, type BroadcastTemplate } from '../mock-data/broadcasts.mock';
import { mockSupportChats, generateMockMessages, type SupportChat, type SupportMessage } from '../mock-data/support.mock';
import { adminApiFetch } from './admin-error-handler';

// 🔄 Switch between mocks and real API
// Set to false when backend is ready
const USE_MOCKS = false; // ✅ Backend is ready!

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========================================
// METRICS API
// ========================================

export const adminApi = {
  /**
   * Get hero metrics (MRR, Users, LTV, CAC)
   */
  async getHeroMetrics() {
    if (USE_MOCKS) {
      await delay(500);
      return mockHeroMetrics;
    }

    const response = await adminApiFetch('/api/admin/metrics/hero');
    const result = await response.json();
    return result;
  },

  /**
   * Get revenue metrics (MRR breakdown, churn, NRR)
   */
  async getRevenueMetrics() {
    if (USE_MOCKS) {
      await delay(500);
      return mockRevenueMetrics;
    }

    const response = await adminApiFetch('/api/admin/metrics/revenue');
    return response.json();
  },

  /**
   * Get growth metrics (user growth, activation, retention)
   */
  async getGrowthMetrics() {
    if (USE_MOCKS) {
      await delay(500);
      return mockGrowthMetrics;
    }

    const response = await adminApiFetch('/api/admin/metrics/growth');
    return response.json();
  },

  /**
   * Get cohort retention data for heatmap
   */
  async getCohortRetention() {
    if (USE_MOCKS) {
      await delay(500);
      // Return empty array - cohort retention will use generateMockCohorts() in component
      return [];
    }

    const response = await adminApiFetch('/api/admin/metrics/cohort-retention');
    return response.json();
  },

  // ========================================
  // USERS API
  // ========================================

  /**
   * Get users list with pagination and filters
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  } = {}) {
    if (USE_MOCKS) {
      await delay(300);

      let filteredUsers = [...mockUsers];

      // Apply search filter
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          u => 
            u.name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (params.status) {
        filteredUsers = filteredUsers.filter(u => u.status === params.status);
      }

      // Apply plan filter
      if (params.plan) {
        filteredUsers = filteredUsers.filter(u => u.plan === params.plan);
      }

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        users: filteredUsers.slice(start, end),
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      };
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.search) queryParams.set('search', params.search);
    if (params.status) queryParams.set('status', params.status);
    if (params.plan) queryParams.set('plan', params.plan);

    const response = await adminApiFetch(`/api/admin/users?${queryParams}`);
    return response.json();
  },

  /**
   * Get user by ID
   */
  async getUserById(id: number) {
    console.log('[DEBUG] adminApi.getUserById called with:', id);
    if (USE_MOCKS) {
      await delay(200);
      const user = mockUsers.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }

    console.log('[DEBUG] adminApi.getUserById fetching:', `/api/admin/users/${id}`);
    const response = await adminApiFetch(`/api/admin/users/${id}`);
    console.log('[DEBUG] adminApi.getUserById response status:', response.status, response.ok);
    const json = await response.json();
    console.log('[DEBUG] adminApi.getUserById parsed JSON:', json);
    console.log('[DEBUG] adminApi.getUserById json.credits:', json?.credits);
    console.log('[DEBUG] adminApi.getUserById json keys:', Object.keys(json));
    return json;
  },

  /**
   * Get user detail (alias for getUserById for consistency)
   */
  async getUserDetail(id: string | number) {
    console.log('[DEBUG] adminApi.getUserDetail called with:', id);
    const result = await this.getUserById(typeof id === 'string' ? parseInt(id, 10) : id);
    console.log('[DEBUG] adminApi.getUserDetail result:', result);
    console.log('[DEBUG] adminApi.getUserDetail result.credits:', result?.credits);
    console.log('[DEBUG] adminApi.getUserDetail result keys:', result ? Object.keys(result) : 'no result');
    return result;
  },

  /**
   * Get user transactions
   */
  async getUserTransactions(userId: number, params: {
    page?: number;
    limit?: number;
    type?: string;
    all?: boolean; // Get all transactions for export
  } = {}) {
    if (USE_MOCKS) {
      await delay(300);
      const count = params.all ? 500 : 50;
      let transactions = generateMockTransactions(userId, count);
      // Filter by type if specified
      if (params.type) {
        transactions = transactions.filter(tx => tx.type === params.type);
      }
      
      // If all is requested, return all transactions
      if (params.all) {
        return {
          transactions,
          total: transactions.length,
        };
      }
      
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        transactions: transactions.slice(start, end),
        total: transactions.length,
        page,
        limit,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));

    const response = await adminApiFetch(`/api/admin/users/${userId}/transactions?${queryParams}`);
    return response.json();
  },

  // ========================================
  // SYSTEM API
  // ========================================

  /**
   * Get system health status
   */
  async getSystemHealth() {
    if (USE_MOCKS) {
      await delay(400);
      return mockSystemHealth;
    }

    const response = await adminApiFetch('/api/admin/system/health');
    return response.json();
  },

  // ========================================
  // ANALYTICS API
  // ========================================

  /**
   * Get funnel analysis data
   */
  async getFunnelAnalysis() {
    if (USE_MOCKS) {
      await delay(300);
      return mockFunnelData;
    }

    const response = await adminApiFetch('/api/admin/analytics/funnel');
    return response.json();
  },

  /**
   * Get feature adoption data
   */
  async getFeatureAdoption() {
    if (USE_MOCKS) {
      await delay(300);
      return mockFeatureAdoption;
    }

    const response = await adminApiFetch('/api/admin/analytics/feature-adoption');
    return response.json();
  },

  /**
   * Get user segments
   */
  async getUserSegments() {
    if (USE_MOCKS) {
      await delay(200);
      return mockUserSegments;
    }

    const response = await adminApiFetch('/api/admin/analytics/user-segments');
    return response.json();
  },

  // ========================================
  // AUDIT LOG API
  // ========================================

  /**
   * Get audit logs
   */
  async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    userId?: number;
    action?: string;
    entityType?: string;
  } = {}) {
    if (USE_MOCKS) {
      await delay(300);
      let filteredLogs = [...mockAuditLogs];

      if (params.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === params.userId);
      }

      if (params.action) {
        filteredLogs = filteredLogs.filter(log => log.action === params.action);
      }

      if (params.entityType) {
        filteredLogs = filteredLogs.filter(log => log.entityType === params.entityType);
      }

      const limit = params.limit || 50;
      const offset = params.offset || 0;

      return {
        logs: filteredLogs.slice(offset, offset + limit),
        total: filteredLogs.length,
        limit,
        offset,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.userId) queryParams.set('userId', String(params.userId));
    if (params.action) queryParams.set('action', params.action);
    if (params.entityType) queryParams.set('entityType', params.entityType);

    const response = await adminApiFetch(`/api/admin/audit-logs?${queryParams.toString()}`);
    return response.json();
  },

  // ========================================
  // BROADCASTS API
  // ========================================

  /**
   * Get broadcast templates
   */
  async getBroadcastTemplates() {
    if (USE_MOCKS) {
      await delay(200);
      return broadcastTemplates;
    }

    const response = await adminApiFetch('/api/admin/broadcasts/templates');
    return response.json();
  },

  /**
   * Get broadcast history
   */
  async getBroadcasts(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    if (USE_MOCKS) {
      await delay(300);
      return mockBroadcasts;
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.status) queryParams.set('status', params.status);

    const response = await adminApiFetch(`/api/admin/broadcasts?${queryParams.toString()}`);
    return response.json();
  },

  /**
   * Send broadcast
   */
  async sendBroadcast(broadcast: {
    title: string;
    message: string;
    targetSegment?: string;
    targetUserIds?: number[];
    scheduledAt?: Date;
  }) {
    if (USE_MOCKS) {
      await delay(500);
      // Simulate sending
      return { success: true, id: Date.now() };
    }

    // Создаем рассылку
    const createResponse = await adminApiFetch('/api/admin/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: broadcast.title,
        message: broadcast.message,
        targetSegment: broadcast.targetSegment,
        targetUserIds: broadcast.targetUserIds,
        scheduledAt: broadcast.scheduledAt?.toISOString(),
      }),
    });
    const created = await createResponse.json();

    // Отправляем рассылку
    const sendResponse = await adminApiFetch(`/api/admin/broadcasts/${created.id}/send`, {
      method: 'POST',
    });
    return sendResponse.json();
  },

  // ========================================
  // SUPPORT API
  // ========================================

  /**
   * Get support chats
   */
  async getSupportChats(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    unreadOnly?: boolean;
  } = {}) {
    if (USE_MOCKS) {
      await delay(300);
      return mockSupportChats;
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.status) queryParams.set('status', params.status);
    if (params.priority) queryParams.set('priority', params.priority);
    if (params.unreadOnly) queryParams.set('unreadOnly', 'true');

    const response = await adminApiFetch(`/api/admin/support/chats?${queryParams.toString()}`);
    return response.json();
  },

  /**
   * Get messages for a chat
   */
  async getChatMessages(chatId: number, limit: number = 100) {
    if (USE_MOCKS) {
      await delay(200);
      return generateMockMessages(chatId);
    }

    const response = await adminApiFetch(`/api/admin/support/chats/${chatId}/messages?limit=${limit}`);
    return response.json();
  },

  /**
   * Send message in support chat
   */
  async sendSupportMessage(chatId: number, message: string) {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true, id: Date.now() };
    }

    const response = await adminApiFetch(`/api/admin/support/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return response.json();
  },

  /**
   * Update support chat status
   */
  async updateSupportChat(chatId: number, status: 'open' | 'closed' | 'pending' | 'resolved') {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true };
    }

    const response = await adminApiFetch(`/api/admin/support/chats/${chatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  /**
   * Mark chat messages as read
   */
  async markChatAsRead(chatId: number) {
    if (USE_MOCKS) {
      await delay(200);
      return { success: true };
    }

    const response = await adminApiFetch(`/api/admin/support/chats/${chatId}/read`, {
      method: 'POST',
    });
    return response.json();
  },

  // ========================================
  // USER MANAGEMENT API
  // ========================================

  /**
   * Update user information
   */
  async updateUser(userId: number, data: { 
    name?: string; 
    email?: string; 
    password?: string;
    isBlocked?: boolean;
  }) {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true, message: 'User updated successfully' };
    }

    const response = await adminApiFetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Block user
   */
  async blockUser(userId: number) {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true, message: 'User blocked successfully' };
    }

    const response = await adminApiFetch(`/api/admin/users/${userId}/block`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Unblock user
   */
  async unblockUser(userId: number) {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true, message: 'User unblocked successfully' };
    }

    const response = await adminApiFetch(`/api/admin/users/${userId}/unblock`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Grant credits to user
   */
  async grantCredits(userId: number, amount: number) {
    if (USE_MOCKS) {
      await delay(300);
      return { success: true, message: `Granted ${amount} credits to user` };
    }

    console.log('[DEBUG] adminApi.grantCredits - Calling API:', { userId, amount });
    const response = await adminApiFetch(`/api/admin/users/${userId}/grant-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const result = await response.json();
    console.log('[DEBUG] adminApi.grantCredits - API response:', result);
    return result;
  },
};

// Export types for use in components
export type { MockUser, MockTransaction, MockAuditLog, Broadcast, BroadcastTemplate, SupportChat, SupportMessage };

