/**
 * Two-Factor Authentication API Routes
 *
 * Endpoints for managing 2FA setup and verification.
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  hasTwoFactorEnabled,
} from '../services/two-factor.service';
import { withAuth } from '../middleware/auth-utils';

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
router.get('/status', withAuth(async (req, res) => {
  const enabled = await hasTwoFactorEnabled(req.user.id);
  res.json({ enabled });
}));

/**
 * POST /api/2fa/setup
 * Generate a new 2FA secret and QR code
 */
router.post('/setup', withAuth(async (req, res) => {
  const alreadyEnabled = await hasTwoFactorEnabled(req.user.id);
  if (alreadyEnabled) {
    return res.status(400).json({ error: '2FA is already enabled' });
  }

  const setup = await generateTwoFactorSecret(req.user.id, req.user.email || '');
  res.json({
    secret: setup.secret,
    qrCode: setup.qrCode,
  });
}));

/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying the initial token
 */
router.post('/enable', withAuth(async (req, res) => {
  const validation = enableSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
  }

  const { secret, token } = validation.data;
  const success = await enableTwoFactor(req.user.id, secret, token);

  if (!success) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  res.json({ success: true, message: '2FA enabled successfully' });
}));

/**
 * POST /api/2fa/disable
 * Disable 2FA (requires current token verification)
 */
router.post('/disable', withAuth(async (req, res) => {
  const validation = tokenSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
  }

  const { token } = validation.data;
  const success = await disableTwoFactor(req.user.id, token);

  if (!success) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  res.json({ success: true, message: '2FA disabled successfully' });
}));

export default router;
