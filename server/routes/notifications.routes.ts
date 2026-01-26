import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { notificationRepository } from "../repositories/notification.repository";
import { notificationService } from "../services/notification.service";

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
router.get("/", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  
  // Check for new notifications first
  await notificationService.checkAndCreateNotifications(userId);
  
  const notifications = await notificationRepository.getNotificationsByUserId(userId);
  res.json(notifications);
}));

/**
 * GET /api/notifications/unread-count
 * Get unread notifications count
 */
router.get("/unread-count", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  
  // Check for new notifications first
  await notificationService.checkAndCreateNotifications(userId);
  
  const count = await notificationRepository.getUnreadCount(userId);
  res.json({ count });
}));

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  const notification = await notificationRepository.markAsRead(notificationId, userId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json(notification);
}));

/**
 * PATCH /api/notifications/:id/dismiss
 * Mark notification as dismissed
 */
router.patch("/:id/dismiss", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  const notification = await notificationRepository.markAsDismissed(notificationId, userId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json(notification);
}));

/**
 * PATCH /api/notifications/:id/complete
 * Mark notification as completed
 */
router.patch("/:id/complete", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  const notification = await notificationRepository.markAsCompleted(notificationId, userId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json(notification);
}));

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete("/:id", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  const deleted = await notificationRepository.deleteNotification(notificationId, userId);
  if (!deleted) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json({ success: true });
}));

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get("/:id", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  const notification = await notificationRepository.getNotificationById(notificationId, userId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json(notification);
}));

export default router;
