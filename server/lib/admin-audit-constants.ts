/**
 * Admin Audit Constants
 * 
 * Constants for admin audit actions and entity types
 * Junior-Friendly: Type-safe constants instead of magic strings
 */

/**
 * Admin Audit Actions
 * 
 * Все возможные действия админов, которые логируются в audit log
 */
export const AdminAuditAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login.failed',
  BROADCAST_CREATE: 'broadcast.create',
  BROADCAST_SEND: 'broadcast.send',
  SUPPORT_MESSAGE: 'support.message',
  SUPPORT_STATUS_UPDATE: 'support.status_update',
  SUPPORT_CHAT_UPDATE: 'support.chat_update',
  USER_UPDATE: 'user.update',
  USER_BLOCK: 'user.block',
  USER_UNBLOCK: 'user.unblock',
  USER_GRANT_CREDITS: 'user.grant_credits',
  BROADCAST_TEMPLATE_CREATE: 'broadcast.template_create',
} as const;

/**
 * Admin Audit Entity Types
 * 
 * Типы сущностей, с которыми работают админы
 */
export const AdminAuditEntityType = {
  ADMIN: 'admin',
  USER: 'user',
  BROADCAST: 'broadcast',
  BROADCAST_TEMPLATE: 'broadcast_template',
  SUPPORT_CHAT: 'support_chat',
} as const;

export type AdminAuditActionType = typeof AdminAuditAction[keyof typeof AdminAuditAction];
export type AdminAuditEntityTypeType = typeof AdminAuditEntityType[keyof typeof AdminAuditEntityType];
