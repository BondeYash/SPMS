import { Router } from "express";
import workerRoutes from "./worker.routes";
import sheetTypeRoutes from "./sheettype.routes";
import productionRoutes from "./production.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/workers", workerRoutes);
router.use("/sheets", sheetTypeRoutes);
router.use("/production", productionRoutes);
router.use("/auth", authRoutes);

export default router;
