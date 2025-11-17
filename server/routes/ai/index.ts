import { Router } from "express";
import chatRoutes from "./chat.routes";
import trainingRoutes from "./training.routes";
import analyzeRoutes from "./analyze.routes";
import receiptsRoutes from "./receipts.routes";
import priceRoutes from "./price.routes";

const router = Router();

// Mount sub-routers
router.use("/chat", chatRoutes);
router.use("/", trainingRoutes);
router.use("/", analyzeRoutes);
router.use("/", receiptsRoutes);
router.use("/", priceRoutes);

export default router;
