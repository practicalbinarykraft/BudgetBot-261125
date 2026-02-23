import { Router } from "express";
import { storage } from "../storage";
import { insertPlannedIncomeSchema, plannedIncome as plannedIncomeTable } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD, getUserExchangeRates } from "../services/currency-service";
import { getErrorMessage } from "../lib/errors";
import { applyPlannedIncome } from "../services/planned-wallet-ops.service";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", withAuth(async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const planned = await storage.getPlannedIncomeByUserId(
      Number(req.user.id),
      status ? { status } : undefined
    );
    res.json(planned);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

router.post("/", withAuth(async (req, res) => {
  try {
    const { userId: _ignoreUserId, ...bodyWithoutUserId } = req.body;
    const data = insertPlannedIncomeSchema.parse(bodyWithoutUserId);
    
    const rates = await getUserExchangeRates(Number(req.user.id));
    const amountUsd = convertToUSD(
      parseFloat(data.amount),
      data.currency || "USD",
      rates
    );

    const plannedItem = await storage.createPlannedIncome({
      ...data,
      amountUsd: amountUsd.toString(),
      userId: Number(req.user.id),
    } as any);
    res.json(plannedItem);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    const { userId, ...sanitizedBody } = req.body;
    const data = insertPlannedIncomeSchema.partial().parse(sanitizedBody);
    
    const updateData: Record<string, any> = {};
    
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
    
    if (data.amount !== undefined || data.currency !== undefined) {
      const amount = data.amount ? parseFloat(data.amount) : parseFloat(plannedItem.amount);
      const currency = data.currency || plannedItem.currency || "USD";
      
      const rates = await getUserExchangeRates(Number(req.user.id));
      const amountUsd = convertToUSD(amount, currency, rates);
      updateData.amountUsd = amountUsd.toString();
    }
    
    const updated = await storage.updatePlannedIncome(id, updateData);
    
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    await storage.deletePlannedIncome(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.post("/:id/receive", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = Number(req.user.id);

    // Fetch wallet outside the transaction (read-only, no lock needed)
    const walletsResult = await storage.getWalletsByUserId(userId);
    const walletsList = walletsResult.wallets;
    const primaryWallet = walletsList.find(w => w.type === "card") || walletsList[0];

    if (!primaryWallet) {
      return res.status(400).json({ error: "No wallet found. Please create a wallet first." });
    }

    // Atomic: lock planned item → check status → create transaction → update status
    await db.transaction(async (tx) => {
      // SELECT FOR UPDATE prevents double-tap race condition
      const [lockedItem] = await tx
        .select()
        .from(plannedIncomeTable)
        .where(and(eq(plannedIncomeTable.id, id), eq(plannedIncomeTable.userId, userId)))
        .for('update')
        .limit(1);

      if (!lockedItem) {
        throw new Error("Planned income not found");
      }
      if (lockedItem.status !== "pending") {
        throw new Error("Only pending income can be received");
      }

      const transaction = await applyPlannedIncome({
        userId,
        walletId: primaryWallet.id,
        amount: lockedItem.amount,
        currency: lockedItem.currency || 'USD',
        amountUsd: lockedItem.amountUsd,
        description: lockedItem.description,
        categoryId: lockedItem.categoryId,
        date: new Date().toISOString().split('T')[0],
        source: 'manual',
      }, tx);

      await tx
        .update(plannedIncomeTable)
        .set({
          status: "received",
          receivedAt: new Date(),
          transactionId: transaction.id,
        })
        .where(eq(plannedIncomeTable.id, id));
    });

    const updated = await storage.getPlannedIncomeById(id);
    res.json(updated);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === "Planned income not found") {
      return res.status(404).json({ error: msg });
    }
    res.status(400).json({ error: msg });
  }
}));

router.post("/:id/cancel", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    if (plannedItem.status !== "pending") {
      return res.status(400).json({ error: "Only pending income can be cancelled" });
    }
    
    await storage.updatePlannedIncome(id, { status: "cancelled" });
    const updated = await storage.getPlannedIncomeById(id);
    
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.patch("/:id/mark-received", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    const { transactionId } = req.body;
    if (!transactionId || typeof transactionId !== 'number') {
      return res.status(400).json({ error: "transactionId is required" });
    }
    
    await storage.updatePlannedIncome(id, {
      status: "received",
      receivedAt: new Date(),
      transactionId: transactionId,
    } as any);
    
    const updated = await storage.getPlannedIncomeById(id);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;
