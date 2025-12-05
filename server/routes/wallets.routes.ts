import { Router } from "express";
import { storage } from "../storage";
import { insertWalletSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD } from "../services/currency-service";
import { calibrateWallet } from "../services/calibration.service";
import { cache, CACHE_TTL } from "../lib/redis";
import { logAuditEvent, AuditAction, AuditEntityType } from "../services/audit-log.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get all wallets
 *     description: Retrieve all wallets for the authenticated user with optional pagination
 *     tags: [Wallets]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: Maximum number of wallets to return (max 1000)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *         description: Number of wallets to skip
 *     responses:
 *       200:
 *         description: List of wallets (array if no pagination params, object with data and pagination if params provided)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Wallet'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/", withAuth(async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const filters: {
      limit?: number;
      offset?: number;
    } = {};

    // Parse pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ error: "Invalid limit. Please provide a positive number." });
      }
      if (limitNum > 1000) {
        return res.status(400).json({ error: "Limit cannot exceed 1000 items." });
      }
      filters.limit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: "Invalid offset. Please provide a non-negative number." });
      }
      filters.offset = offsetNum;
    }

    // Build cache key based on pagination params
    const cacheKey = `wallets:user:${req.user.id}:limit:${filters.limit || 'all'}:offset:${filters.offset || 0}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // If not in cache, get from database
    const result = await storage.getWalletsByUserId(req.user.id, filters);

    // Prepare response
    const response = filters.limit !== undefined || filters.offset !== undefined
      ? {
          data: result.wallets,
          pagination: {
            total: result.total,
            limit: filters.limit,
            offset: filters.offset || 0,
          },
        }
      : result.wallets; // Backward compatibility: return array if no pagination params

    // Store in cache for 30 minutes
    await cache.set(cacheKey, response, CACHE_TTL.LONG);

    res.json(response);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/wallets
router.post("/", withAuth(async (req, res) => {
  try {
    let data = insertWalletSchema.parse({
      ...req.body,
      userId: Number(req.user.id),
    });

    // 💱 Multi-currency: Calculate USD equivalent for non-USD wallets
    if (data.currency && data.currency !== "USD") {
      const balanceAmount = parseFloat(data.balance);
      const balanceUsdValue = convertToUSD(balanceAmount, data.currency);
      data = { ...data, balanceUsd: balanceUsdValue.toFixed(2) };
    } else {
      // USD wallet - balanceUsd = balance
      data = { ...data, balanceUsd: data.balance };
    }

    const wallet = await storage.createWallet(data);

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.WALLET,
      entityId: wallet.id,
      metadata: {
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
      },
      req,
    });

    // Invalidate cache
    await cache.del(`wallets:user:${req.user.id}`);

    res.json(wallet);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/wallets/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wallet = await storage.getWalletById(id);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // 🔒 Security: Strip userId from client
    const { userId, ...sanitizedBody } = req.body;
    let data = insertWalletSchema.partial().parse(sanitizedBody);

    // 💱 Multi-currency: Recompute balanceUsd if balance or currency changed
    if (data.balance || data.currency) {
      const balance = data.balance ? parseFloat(data.balance) : parseFloat(wallet.balance);
      const currency = data.currency || wallet.currency || "USD";

      if (currency !== "USD") {
        const balanceUsdValue = convertToUSD(balance, currency);
        data = { ...data, balanceUsd: balanceUsdValue.toFixed(2) };
      } else {
        data = { ...data, balanceUsd: balance.toFixed(2) };
      }
    }

    const updated = await storage.updateWallet(id, data);

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.WALLET,
      entityId: id,
      metadata: {
        changes: data,
      },
      req,
    });

    // Invalidate cache
    await cache.del(`wallets:user:${req.user.id}`);

    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// DELETE /api/wallets/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wallet = await storage.getWalletById(id);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    await storage.deleteWallet(id);

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.WALLET,
      entityId: id,
      metadata: {
        walletName: wallet.name,
      },
      req,
    });

    // Invalidate cache
    await cache.del(`wallets:user:${req.user.id}`);

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/wallets/:id/calibrate
router.post("/:id/calibrate", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const walletId = parseInt(req.params.id);
    const { actualBalance } = req.body;
    
    if (actualBalance === undefined || actualBalance === null || Number.isNaN(Number(actualBalance))) {
      return res.status(400).json({ error: 'actualBalance required' });
    }
    
    const result = await calibrateWallet(
      userId,
      walletId,
      parseFloat(actualBalance)
    );

    // Invalidate cache after calibration
    await cache.del(`wallets:user:${req.user.id}`);

    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;
