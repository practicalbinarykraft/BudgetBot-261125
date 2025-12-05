/**
 * Two-Factor Authentication API Routes
 *
 * Endpoints for managing 2FA setup and verification.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  hasTwoFactorEnabled,
} from '../services/two-factor.service';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Validation schemas
const tokenSchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

const enableSchema = z.object({
  secret: z.string().min(16),
  token: z.string().length(6).regex(/^\d+$/),
});

/**
 * GET /api/2fa/status
 * Check if 2FA is enabled for the current user
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const enabled = await hasTwoFactorEnabled(authReq.user.id);
    res.json({ enabled });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/2fa/setup
 * Generate a new 2FA secret and QR code
 */
router.post('/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if already enabled
    const alreadyEnabled = await hasTwoFactorEnabled(authReq.user.id);
    if (alreadyEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const setup = await generateTwoFactorSecret(authReq.user.id, authReq.user.email);
    res.json({
      secret: setup.secret,
      qrCode: setup.qrCode,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying the initial token
 */
router.post('/enable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = enableSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { secret, token } = validation.data;
    const success = await enableTwoFactor(authReq.user.id, secret, token);

    if (!success) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA (requires current token verification)
 */
router.post('/disable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = tokenSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
    }

    const { token } = validation.data;
    const success = await disableTwoFactor(authReq.user.id, token);

    if (!success) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
