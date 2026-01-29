import { db } from "../db";
import { notifications, InsertNotification, Notification } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class NotificationRepository {
  /**
   * Get all notifications for a user, ordered by creation date (newest first)
   */
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, "unread")
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  /**
   * Create a new notification
   */
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .update(notifications)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    
    return notification || null;
  }

  /**
   * Mark notification as dismissed
   */
  async markAsDismissed(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .update(notifications)
      .set({
        status: "dismissed",
        dismissedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    
    return notification || null;
  }

  /**
   * Mark notification as completed
   */
  async markAsCompleted(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .update(notifications)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    
    return notification || null;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .limit(1);
    
    return notification || null;
  }
}

export const notificationRepository = new NotificationRepository();
