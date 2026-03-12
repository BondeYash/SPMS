import { Router } from "express";
import workerRoutes from "./worker.routes";
import sheetTypeRoutes from "./sheettype.routes";
import productionRoutes from "./production.routes";
import authRoutes from "./auth.routes";
import attendanceRoutes from "./attendance.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

router.use("/workers", workerRoutes);
router.use("/sheets", sheetTypeRoutes);
router.use("/production", productionRoutes);
router.use("/auth", authRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/notifications", notificationRoutes);

export default router;
