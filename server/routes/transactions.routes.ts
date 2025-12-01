import { Router } from "express";
import { insertTransactionSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { transactionService } from "../services/transaction.service";
import { z } from "zod";
import { parse, isValid, format } from "date-fns";
import { BadRequestError, NotFoundError, ValidationError } from "../lib/errors";
import { logAuditEvent, AuditAction, AuditEntityType } from "../services/audit-log.service";
import { checkBudgetAlert, notifyTransactionCreated } from "../services/realtime-notifications.service";

const router = Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve all transactions for the authenticated user with optional filtering and pagination
 *     tags: [Transactions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: Filter transactions up to this date (YYYY-MM-DD)
 *       - in: query
 *         name: personalTagId
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Filter by personal tag ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *           default: 100
 *         description: Maximum number of transactions to return (default 100, max 1000)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *           default: 0
 *         description: Number of transactions to skip for pagination (default 0)
 *     responses:
 *       200:
 *         description: Paginated list of transactions with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 250
 *                       description: Total number of transactions matching filters
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                       description: Maximum number of items per page
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                       description: Number of items skipped
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/", withAuth(async (req, res) => {
  try {
    const { from, to, personalTagId, limit, offset } = req.query;

    const filters: {
      personalTagId?: number;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {};

    const dateSchema = z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine(
        (val) => {
          const parsed = parse(val, 'yyyy-MM-dd', new Date());
          if (!isValid(parsed)) return false;
          return format(parsed, 'yyyy-MM-dd') === val;
        },
        { message: "Invalid calendar date" }
      );

    if (from) {
      const result = dateSchema.safeParse(String(from));
      if (!result.success) {
        throw new BadRequestError("Invalid 'from' date. Please use YYYY-MM-DD format (e.g., 2024-01-15)");
      }
      filters.from = result.data;
    }
    if (to) {
      const result = dateSchema.safeParse(String(to));
      if (!result.success) {
        throw new BadRequestError("Invalid 'to' date. Please use YYYY-MM-DD format (e.g., 2024-12-31)");
      }
      filters.to = result.data;
    }
    if (personalTagId) {
      const tagIdStr = String(personalTagId);
      if (!/^\d+$/.test(tagIdStr)) {
        throw new BadRequestError("Invalid tag ID. Please provide a valid number.");
      }
      const parsedId = parseInt(tagIdStr);
      if (parsedId <= 0) {
        throw new BadRequestError("Invalid tag ID. Please provide a valid number.");
      }
      filters.personalTagId = parsedId;
    }

    // Parse pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        throw new BadRequestError("Invalid limit. Please provide a positive number.");
      }
      if (limitNum > 1000) {
        throw new BadRequestError("Limit cannot exceed 1000 items.");
      }
      filters.limit = limitNum;
    } else {
      // Default limit to prevent returning too many records
      filters.limit = 100;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        throw new BadRequestError("Invalid offset. Please provide a non-negative number.");
      }
      filters.offset = offsetNum;
    }

    const result = await transactionService.getTransactions(req.user.id, filters);

    res.json({
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset || 0,
      },
    });
  } catch (error: any) {
    // Let error handler middleware handle it
    throw error;
  }
}));

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new income or expense transaction
 *     tags: [Transactions]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - description
 *               - date
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               amount:
 *                 type: string
 *                 example: "50.00"
 *               description:
 *                 type: string
 *                 example: "Grocery shopping"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               category:
 *                 type: string
 *                 nullable: true
 *                 example: "Food"
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               walletId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               personalTagId:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *               financialType:
 *                 type: string
 *                 enum: [essential, discretionary, investment, debt]
 *                 example: "essential"
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/", withAuth(async (req, res) => {
  try {
    const validated = insertTransactionSchema.omit({ userId: true }).parse(req.body);

    const transaction = await transactionService.createTransaction(req.user.id, {
      type: validated.type,
      amount: parseFloat(validated.amount),
      description: validated.description,
      category: validated.category || undefined,
      date: validated.date,
      currency: validated.currency || undefined,
      source: 'manual',
      walletId: validated.walletId || undefined,
      personalTagId: validated.personalTagId !== undefined ? validated.personalTagId : null,
      financialType: validated.financialType || undefined,
    });

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: transaction.id,
      metadata: {
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        category: transaction.category,
      },
      req,
    });

    // Send real-time notification
    notifyTransactionCreated({
      userId: req.user.id,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
      },
    });

    // Check budget alert (only for expenses)
    if (transaction.type === 'expense' && transaction.categoryId) {
      await checkBudgetAlert({
        userId: req.user.id,
        categoryId: transaction.categoryId,
        amount: parseFloat(transaction.amount),
        transactionDate: transaction.date,
      });
    }

    res.json(transaction);
  } catch (error: any) {
    // Wrap Zod validation errors in user-friendly message
    if (error.name === 'ZodError') {
      throw new ValidationError('Please check your input and try again', error.errors);
    }
    throw error;
  }
}));

// PATCH /api/transactions/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // 🔒 Security: Strip categoryId AND userId from client - always resolve server-side!
    const { categoryId, userId, ...sanitizedBody } = req.body;

    // Validate update data
    const data = insertTransactionSchema.partial().parse(sanitizedBody);

    const updated = await transactionService.updateTransaction(id, req.user.id, data);

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
      metadata: {
        changes: data,
      },
      req,
    });

    res.json(updated);
  } catch (error: any) {
    if (error.message === "Transaction not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/transactions/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await transactionService.deleteTransaction(id, req.user.id);

    // Log audit event
    await logAuditEvent({
      userId: req.user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
      req,
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.message === "Transaction not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
}));

export default router;
