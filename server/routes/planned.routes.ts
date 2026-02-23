import { Router } from "express";
import { storage } from "../storage";
import { insertPlannedTransactionSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { getErrorMessage } from "../lib/errors";
import { getUserExchangeRates, convertToUSD } from "../services/currency-service";
import { applyPlannedPurchase } from "../services/planned-wallet-ops.service";

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
    const plannedItem = await storage.getPlannedById(id);
    
    if (!plannedItem || plannedItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Planned transaction not found" });
    }
    
    if (plannedItem.status !== "planned") {
      return res.status(400).json({ error: "Only planned items can be purchased" });
    }
    
    const { wallets } = await storage.getWalletsByUserId(Number(req.user.id));
    const primaryWallet = wallets.find(w => w.type === "card") || wallets[0];

    if (!primaryWallet) {
      return res.status(400).json({ error: "No wallet found. Please create a wallet first." });
    }

    // Get currency from planned item or fallback to wallet/USD
    const currency = plannedItem.currency || primaryWallet.currency || "USD";

    // Convert amount to USD if currency is not USD
    let amountUsd: string;
    if (currency !== "USD") {
      const rates = await getUserExchangeRates(Number(req.user.id));
      const usdValue = convertToUSD(parseFloat(plannedItem.amount), currency, rates);
      amountUsd = usdValue.toFixed(2);
    } else {
      amountUsd = plannedItem.amount;
    }

    const transaction = await applyPlannedPurchase({
      userId: Number(req.user.id),
      walletId: primaryWallet.id,
      amount: plannedItem.amount,
      currency,
      amountUsd,
      description: plannedItem.name,
      category: plannedItem.category,
      date: new Date().toISOString().split('T')[0],
      source: 'manual',
    });

    await storage.updatePlanned(id, {
      status: "purchased",
      purchasedAt: new Date(),
      transactionId: transaction.id,
    });
    
    const updated = await storage.getPlannedById(id);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
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
