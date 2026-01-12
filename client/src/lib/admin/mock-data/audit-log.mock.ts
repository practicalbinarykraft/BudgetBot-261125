/**
 * Mock Audit Log Data
 *
 * Realistic mock data for admin audit log
 * Junior-Friendly: Simple array, clear structure
 */

// Note: We can't import from server in client code, so we define types here
const AuditAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  BULK_DELETE: 'bulk_delete',
  BULK_UPDATE: 'bulk_update',
  EXPORT: 'export',
  IMPORT: 'import',
  SETTINGS_CHANGE: 'settings_change',
} as const;

const AuditEntityType = {
  TRANSACTION: 'transaction',
  WALLET: 'wallet',
  BUDGET: 'budget',
  CATEGORY: 'category',
  USER: 'user',
  SETTINGS: 'settings',
  API_KEY: 'api_key',
} as const;

export interface MockAuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Generate mock audit logs
function generateMockAuditLogs(count: number = 200): MockAuditLog[] {
  const logs: MockAuditLog[] = [];
  const now = new Date();
  
  const actions = [
    AuditAction.LOGIN,
    AuditAction.LOGOUT,
    AuditAction.REGISTER,
    AuditAction.CREATE,
    AuditAction.UPDATE,
    AuditAction.DELETE,
    AuditAction.VIEW,
    AuditAction.PASSWORD_CHANGE,
    AuditAction.SETTINGS_CHANGE,
  ];

  const entityTypes = [
    AuditEntityType.TRANSACTION,
    AuditEntityType.WALLET,
    AuditEntityType.BUDGET,
    AuditEntityType.CATEGORY,
    AuditEntityType.USER,
    AuditEntityType.SETTINGS,
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    'TelegramBot/1.0',
  ];

  const ipAddresses = [
    '192.168.1.1',
    '10.0.0.1',
    '172.16.0.1',
    '203.0.113.1',
    '198.51.100.1',
  ];

  let seed = 54321;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(seededRandom() * 90); // Last 90 days
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(Math.floor(seededRandom() * 24));
    createdAt.setMinutes(Math.floor(seededRandom() * 60));

    const action = actions[Math.floor(seededRandom() * actions.length)];
    const entityType = entityTypes[Math.floor(seededRandom() * entityTypes.length)];
    const userId = Math.floor(seededRandom() * 150) + 1; // Users 1-150
    const entityId = action !== AuditAction.LOGIN && action !== AuditAction.LOGOUT && action !== AuditAction.REGISTER
      ? Math.floor(seededRandom() * 1000) + 1
      : null;

    let metadata: Record<string, any> | null = null;
    if (action === AuditAction.CREATE || action === AuditAction.UPDATE) {
      metadata = {
        field: 'amount',
        oldValue: action === AuditAction.UPDATE ? (Math.random() * 1000).toFixed(2) : null,
        newValue: (Math.random() * 1000).toFixed(2),
      };
    } else if (action === AuditAction.LOGIN) {
      metadata = {
        method: seededRandom() > 0.5 ? 'email' : 'telegram',
        success: true,
      };
    }

    logs.push({
      id: i + 1,
      userId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: ipAddresses[Math.floor(seededRandom() * ipAddresses.length)],
      userAgent: userAgents[Math.floor(seededRandom() * userAgents.length)],
      createdAt,
    });
  }

  // Sort by createdAt (newest first)
  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export const mockAuditLogs: MockAuditLog[] = generateMockAuditLogs(200);

