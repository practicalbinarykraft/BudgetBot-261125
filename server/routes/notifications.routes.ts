import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { notificationRepository } from "../repositories/notification.repository";
import { notificationService } from "../services/notification.service";
import { transactionService } from "../services/transaction.service";
import { getPrimaryWallet, updateWalletBalance } from "../services/wallet.service";
import { recurringRepository } from "../repositories/recurring.repository";
import { notificationTransactionDataSchema } from "@shared/schema";
import logger from "../lib/logger";

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
 * Mark notification as completed and create transaction from notification data
 */
router.patch("/:id/complete", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);
  
  try {
    logger.info('Starting notification completion', { userId, notificationId });
    
    // Get notification first to extract transaction data
    const notification = await notificationRepository.getNotificationById(notificationId, userId);
    if (!notification) {
      logger.warn('Notification not found', { userId, notificationId });
      return res.status(404).json({ error: "Notification not found" });
    }

    logger.info('Notification found', { 
      userId, 
      notificationId, 
      type: notification.type,
      hasTransactionData: !!notification.transactionData 
    });

    // Extract and validate transaction data from notification
    if (!notification.transactionData) {
      logger.warn('Cannot complete notification: missing transactionData', {
        userId,
        notificationId,
      });
      return res.status(400).json({
        error: "Cannot complete notification: missing transaction data",
        details: "Transaction data is incomplete. Please use the transaction dialog to create this transaction."
      });
    }

    const transactionDataParseResult = notificationTransactionDataSchema.safeParse(notification.transactionData);
    
    if (!transactionDataParseResult.success) {
      logger.warn('Cannot complete notification: invalid transactionData', {
        userId,
        notificationId,
        errors: transactionDataParseResult.error.errors,
      });
      return res.status(400).json({
        error: "Cannot complete notification: invalid transaction data",
        details: transactionDataParseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    const transactionData = transactionDataParseResult.data;
    
    logger.info('Transaction data extracted and validated', {
      userId,
      notificationId,
      transactionData: {
        amount: transactionData.amount,
        currency: transactionData.currency,
        description: transactionData.description,
        type: transactionData.type,
        date: transactionData.date,
        category: transactionData.category,
      }
    });

    // Create transaction from transactionData (already validated above)
    try {
      logger.info('Getting primary wallet', { userId });
      
      // Get primary wallet for the user
      const primaryWallet = await getPrimaryWallet(userId);
      
      logger.info('Primary wallet retrieved', {
        userId,
        walletId: primaryWallet.id,
        walletCurrency: primaryWallet.currency
      });

      // Parse amount - handle both string and number types
      const amount = typeof transactionData.amount === 'string'
        ? parseFloat(transactionData.amount)
        : Number(transactionData.amount);

      logger.info('Creating transaction', {
        userId,
        notificationId,
        amount,
        type: transactionData.type,
        description: transactionData.description,
        date: transactionData.date,
        currency: transactionData.currency,
        walletId: primaryWallet.id
      });

      // Create transaction from notification data
      const transaction = await transactionService.createTransaction(userId, {
        type: transactionData.type as 'income' | 'expense',
        amount: amount,
        description: transactionData.description,
        category: transactionData.category || undefined,
        categoryId: transactionData.categoryId ?? null,
        date: transactionData.date,
        currency: transactionData.currency || 'USD',
        walletId: primaryWallet.id,
        source: 'notification',
      });

      logger.info('Transaction created successfully', {
        userId,
        notificationId,
        transactionId: transaction.id,
        amountUsd: transaction.amountUsd
      });

      // Update wallet balance
      const amountUsd = parseFloat(transaction.amountUsd);
      
      logger.info('Updating wallet balance', {
        userId,
        walletId: primaryWallet.id,
        amountUsd,
        transactionType: transactionData.type
      });
      
      await updateWalletBalance(
        primaryWallet.id,
        userId,
        amountUsd,
        transactionData.type as 'income' | 'expense'
      );
      
      logger.info('Wallet balance updated successfully', {
        userId,
        walletId: primaryWallet.id
      });

      logger.info('Transaction created from notification with wallet balance updated', {
        userId,
        notificationId,
        transactionId: transaction.id,
        transactionType: transactionData.type,
        amount: transactionData.amount,
        amountUsd,
        walletId: primaryWallet.id,
      });

      // If this is a recurring notification, update nextDate
      if (notification.type === 'recurring_expense' || notification.type === 'recurring_income') {
        if (transactionData.recurringId && transactionData.frequency) {
          const currentDate = new Date(transactionData.date);
          await recurringRepository.updateNextDate(
            transactionData.recurringId,
            currentDate,
            transactionData.frequency
          );

          logger.info('Recurring transaction nextDate updated', {
            userId,
            recurringId: transactionData.recurringId,
            frequency: transactionData.frequency,
          });
        }
      }
    } catch (transactionError) {
      logger.error('Failed to create transaction from notification', {
        error: transactionError instanceof Error ? transactionError.message : String(transactionError),
        userId,
        notificationId,
        transactionData,
      });

      // Don't mark notification as completed if transaction creation failed
      return res.status(500).json({
        error: "Failed to create transaction",
        details: transactionError instanceof Error ? transactionError.message : String(transactionError)
      });
    }

    // Mark notification as completed only after successful transaction creation
    const completedNotification = await notificationRepository.markAsCompleted(notificationId, userId);
    if (!completedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json(completedNotification);
  } catch (error) {
    logger.error('Error completing notification', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      notificationId,
    });
    
    return res.status(500).json({ 
      error: "Failed to complete notification",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * PATCH /api/notifications/:id/mark-completed
 * Mark notification as completed WITHOUT creating a transaction
 * Used when transaction was already created through the transaction dialog
 */
router.patch("/:id/mark-completed", withAuth(async (req, res) => {
  const userId = Number(req.user.id);
  const notificationId = Number(req.params.id);

  const notification = await notificationRepository.markAsCompleted(notificationId, userId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  logger.info('Notification marked as completed (no transaction created)', {
    userId,
    notificationId,
  });

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
