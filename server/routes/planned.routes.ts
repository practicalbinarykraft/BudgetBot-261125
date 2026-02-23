import { Router } from "express";
import { storage } from "../storage";
import { insertPlannedTransactionSchema, plannedTransactions } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { getErrorMessage } from "../lib/errors";
import { getUserExchangeRates, convertToUSD } from "../services/currency-service";
import { applyPlannedPurchase } from "../services/planned-wallet-ops.service";
import { db } from "../db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", withAuth(async (req, res) => {
  try {
    const planned = await storage.getPlannedByUserId(Number(req.user.id));
    res.json(planned);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertPlannedTransactionSchema.parse({
      ...req.body,
      userId: Number(req.user.id),
      currency: req.body.currency || "USD", // Default to USD if not provided
    });
    const plannedItem = await storage.createPlanned(data);
    res.json(plannedItem);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedById(id);
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned transaction not found" });
    }
    
    const { userId, ...sanitizedBody } = req.body;
    const data = insertPlannedTransactionSchema.partial().parse(sanitizedBody);
    const updated = await storage.updatePlanned(id, data);

    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedById(id);
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned transaction not found" });
    }
    await storage.deletePlanned(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.post("/:id/purchase", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = Number(req.user.id);

    // Fetch wallet outside the transaction (read-only, no lock needed)
    const { wallets } = await storage.getWalletsByUserId(userId);
    const primaryWallet = wallets.find(w => w.type === "card") || wallets[0];

    if (!primaryWallet) {
      return res.status(400).json({ error: "No wallet found. Please create a wallet first." });
    }

    // Atomic: lock planned item → check status → create transaction → update status
    await db.transaction(async (tx) => {
      // SELECT FOR UPDATE prevents double-tap race condition
      const [lockedItem] = await tx
        .select()
        .from(plannedTransactions)
        .where(and(eq(plannedTransactions.id, id), eq(plannedTransactions.userId, userId)))
        .for('update')
        .limit(1);

      if (!lockedItem) {
        throw new Error("Planned transaction not found");
      }
      if (lockedItem.status !== "planned") {
        throw new Error("Only planned items can be purchased");
      }

      const currency = lockedItem.currency || primaryWallet.currency || "USD";
      let amountUsd: string;
      if (currency !== "USD") {
        const rates = await getUserExchangeRates(userId);
        const usdValue = convertToUSD(parseFloat(lockedItem.amount), currency, rates);
        amountUsd = usdValue.toFixed(2);
      } else {
        amountUsd = lockedItem.amount;
      }

      const transaction = await applyPlannedPurchase({
        userId,
        walletId: primaryWallet.id,
        amount: lockedItem.amount,
        currency,
        amountUsd,
        description: lockedItem.name,
        category: lockedItem.category,
        date: new Date().toISOString().split('T')[0],
        source: 'manual',
      }, tx);

      await tx
        .update(plannedTransactions)
        .set({
          status: "purchased",
          purchasedAt: new Date(),
          transactionId: transaction.id,
        })
        .where(eq(plannedTransactions.id, id));
    });

    const updated = await storage.getPlannedById(id);
    res.json(updated);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === "Planned transaction not found") {
      return res.status(404).json({ error: msg });
    }
    res.status(400).json({ error: msg });
  }
}));

router.post("/:id/cancel", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedById(id);
    
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned transaction not found" });
    }
    
    if (plannedItem.status !== "planned") {
      return res.status(400).json({ error: "Only planned items can be cancelled" });
    }
    
    await storage.updatePlanned(id, { status: "cancelled" });
    const updated = await storage.getPlannedById(id);
    
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

router.patch("/:id/mark-purchased", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedById(id);
    
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned transaction not found" });
    }
    
    const { transactionId } = req.body;
    if (!transactionId || typeof transactionId !== 'number') {
      return res.status(400).json({ error: "transactionId is required" });
    }
    
    await storage.updatePlanned(id, {
      status: "purchased",
      purchasedAt: new Date(),
      transactionId: transactionId,
    });
    
    const updated = await storage.getPlannedById(id);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;
