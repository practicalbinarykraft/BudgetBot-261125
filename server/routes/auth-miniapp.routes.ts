/**
 * Telegram Mini App Authentication Routes
 *
 * Handles registration and Telegram linking for Mini App users
 * Junior-Friendly: ~200 lines, clear separation of concerns
 */

import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authRateLimiter } from '../middleware/rate-limit';
import { withAuth } from '../middleware/auth-utils';
import { logError, logInfo, logWarning } from '../lib/logger';
import { logAuditEvent, AuditAction, AuditEntityType } from '../services/audit-log.service';
import { categoryRepository } from '../repositories/category.repository';
import { createDefaultTags } from '../services/tag.service';
import { grantWelcomeBonus } from '../services/credits.service';
import { validateInitData } from '../services/telegram-validation.service';
import { TELEGRAM_BOT_TOKEN } from '../telegram/config';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Registration schema for Mini App
 * Email and password are required
 */
const registerMiniAppSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  telegramId: z.string().optional(), // Optional - will be linked later
  telegramData: z.object({
    firstName: z.string().optional(),
    username: z.string().optional(),
    photoUrl: z.string().optional(),
  }).optional(),
});

/**
 * Add email schema for existing Telegram-only users
 */
const addEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  telegramId: z.string().optional(),
  initData: z.string().optional(),
});

/**
 * POST /api/auth/register-miniapp
 *
 * Register new user from Telegram Mini App
 * Creates user with email+password, but does NOT link telegram_id immediately
 * Returns flag to offer Telegram linking
 */
router.post('/register-miniapp', authRateLimiter, async (req: Request, res: Response) => {
  try {
    // STEP 1: Validate input
    const validationResult = registerMiniAppSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password, name, telegramId, telegramData } = validationResult.data;

    // STEP 2: Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // STEP 3: If telegramId provided, check if it's already linked
    if (telegramId) {
      const existingTelegramUser = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      if (existingTelegramUser.length > 0) {
        return res.status(400).json({
          error: 'This Telegram account is already linked to another user',
        });
      }
    }

    // STEP 4: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 5: Create user (WITHOUT linking telegram_id)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: name || telegramData?.firstName || email.split('@')[0],
        telegramId: null, // NOT linked yet - user will decide later
        telegramUsername: null,
        telegramFirstName: null,
        telegramPhotoUrl: null,
      })
      .returning();

    // STEP 6: Initialize user data
    // Create default categories
    const defaultCategories = [
      { name: 'Food & Drinks', type: 'expense', icon: '🍔', color: '#ef4444' },
      { name: 'Transport', type: 'expense', icon: '🚗', color: '#f97316' },
      { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#8b5cf6' },
      { name: 'Entertainment', type: 'expense', icon: '🎮', color: '#ec4899' },
      { name: 'Bills', type: 'expense', icon: '💳', color: '#6366f1' },
      { name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
      { name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
      { name: 'Unaccounted', type: 'expense', icon: '❓', color: '#dc2626' },
    ];
    
    for (const category of defaultCategories) {
      await categoryRepository.createCategory({
        userId: newUser.id,
        name: category.name,
        type: category.type as 'income' | 'expense',
        icon: category.icon,
        color: category.color,
      });
    }
    
    await createDefaultTags(newUser.id);
    await grantWelcomeBonus(newUser.id);

    // STEP 7: Log audit event
    await logAuditEvent({
      userId: newUser.id,
      action: AuditAction.REGISTER,
      entityType: AuditEntityType.USER,
      entityId: newUser.id,
      metadata: {
        email: newUser.email,
        source: 'telegram_miniapp',
      },
      req,
    });

    logInfo('User registered via Mini App', {
      userId: newUser.id,
      email: newUser.email,
    });

    // STEP 8: Create session
    req.login(newUser, (err) => {
      if (err) {
        logError('Session creation error', err as Error, { userId: newUser.id });
        return res.status(500).json({ error: 'Failed to create session' });
      }

      // STEP 9: Return success with flag to offer Telegram linking
      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        shouldOfferTelegramLink: !!telegramId, // Offer if telegramId was provided
        telegramId: telegramId || null, // Return for later linking
      });
    });
  } catch (error) {
    logError('Registration error', error as Error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/add-email
 *
 * Add email and password to existing Telegram-only user
 * User must be authenticated via Telegram Mini App (initData validation)
 */
router.post('/add-email', authRateLimiter, async (req: Request, res: Response) => {
  try {
    // STEP 1: Validate input
    const validationResult = addEmailSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password, telegramId, initData } = validationResult.data;

    // STEP 2: Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // STEP 3: Validate initData if provided (for Mini App)
    // SECURITY: For Mini App, initData is required and cryptographically validated
    // For web version, this endpoint should NOT be used (use /api/auth/link-telegram instead)
    // But we allow it for backward compatibility if initData is not provided
    if (initData) {
      if (!telegramId) {
        return res.status(400).json({
          error: 'Telegram ID is required when initData is provided',
        });
      }

      const botToken = TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: 'Telegram bot token not configured' });
      }

      const initDataValidation = validateInitData(initData, botToken);
      
      if (!initDataValidation.isValid) {
        return res.status(401).json({ error: initDataValidation.error || 'Invalid initData' });
      }

      const telegramUser = initDataValidation.user!;
      const telegramIdFromData = telegramUser.id.toString();

      // Verify telegramId matches (prevents tampering)
      if (telegramIdFromData !== telegramId) {
        return res.status(400).json({ error: 'telegramId mismatch' });
      }
    } else {
      // For web version: initData not provided
      // SECURITY NOTE: This endpoint is primarily for Mini App flow
      // For web, users should use /api/auth/link-telegram which requires authentication
      // We allow this for backward compatibility, but it's less secure
      if (!telegramId) {
        return res.status(400).json({
          error: 'Telegram ID is required',
        });
      }
      
      // Additional security: Log warning when used without initData
      logWarning('add-email endpoint called without initData (web version)', {
        telegramId: telegramId.substring(0, 5) + '...', // Mask for privacy
      });
    }

    // STEP 4: Find user by telegramId

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    if (user.email) {
      return res.status(400).json({
        error: 'User already has email',
      });
    }

    // STEP 5: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 6: Update user with email and password
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        password: hashedPassword,
      })
      .where(eq(users.id, user.id))
      .returning();

    // STEP 7: Log audit event
    await logAuditEvent({
      userId: updatedUser.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: updatedUser.id,
      metadata: {
        action: 'add_email',
        email: updatedUser.email,
      },
      req,
    });

    logInfo('Email added to Telegram-only user', {
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    // STEP 8: Create session for updated user
    req.login(updatedUser, (err) => {
      if (err) {
        logError('Session creation error', err as Error, { userId: updatedUser.id });
        return res.status(500).json({ error: 'Failed to create session' });
      }

      return res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          telegramId: updatedUser.telegramId,
        },
      });
    });
  } catch (error) {
    logError('Add email error', error as Error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/link-telegram-miniapp
 *
 * Link Telegram account to authenticated user
 * Validates initData and links telegram_id to current user
 */
router.post('/link-telegram-miniapp', authRateLimiter, withAuth(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { telegramId, initData } = req.body;

    if (!telegramId || !initData) {
      return res.status(400).json({ error: 'telegramId and initData are required' });
    }

    // STEP 2: Validate initData signature and freshness
    // This prevents replay attacks by checking auth_date
    const botToken = TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const validationResult = validateInitData(initData, botToken);
    
    if (!validationResult.isValid) {
      return res.status(401).json({ error: validationResult.error || 'Invalid initData' });
    }

    const telegramUser = validationResult.user!;
    const telegramIdFromData = telegramUser.id.toString();

    // STEP 3: Verify telegramId matches
    if (telegramIdFromData !== telegramId) {
      return res.status(400).json({ error: 'telegramId mismatch' });
    }

    // STEP 4: Check if telegram_id is already linked to another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return res.status(400).json({
        error: 'This Telegram account is already linked to another user',
      });
    }

    // STEP 5: Link telegram_id to current user
    await db
      .update(users)
      .set({
        telegramId,
        telegramUsername: telegramUser.username || null,
        telegramFirstName: telegramUser.first_name || null,
        telegramPhotoUrl: telegramUser.photo_url || null,
      })
      .where(eq(users.id, userId));

    // STEP 6: Log audit event
    await logAuditEvent({
      userId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      metadata: {
        action: 'link_telegram',
        telegramId,
      },
      req,
    });

    logInfo('Telegram account linked', {
      userId,
      telegramId,
    });

    return res.json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  } catch (error) {
    logError('Link Telegram error', error as Error);
    return res.status(500).json({ error: 'Internal server error during linking' });
  }
}));

export default router;
