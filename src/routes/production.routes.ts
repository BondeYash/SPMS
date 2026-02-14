import { Router } from "express";
import { ProductionController } from "../controllers/ProductionController";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
const productionController = new ProductionController();

// Worker creates production (authenticated worker)
router.post("/create-production", requireAuth, requireRole("worker"), productionController.create);
// Worker gets own history
router.get("/history/me", requireAuth, requireRole("worker"), productionController.getMyHistory);

// Admin gets history of a specific worker
router.get("/history/:workerId", requireAuth, requireRole("admin"), productionController.getHistory);

// Get stats for a specific day (Query param: ?date=YYYY-MM-DD) - accessible to admins
router.get("/stats/daily", requireAuth, requireRole("admin"), productionController.getDailyStats);

// Get monthly stats for a worker - admin only (keeps existing behavior)
router.get("/stats/monthly/:workerId/:year/:month", requireAuth, requireRole("admin"), productionController.getMonthlyStats);

// Worker: view own monthly earnings
router.get("/stats/monthly/me/:year/:month", requireAuth, requireRole("worker"), productionController.getMyMonthlyStats);

// Admin: aggregate earnings for all workers for a month
router.get("/stats/monthly/all/:year/:month", requireAuth, requireRole("admin"), productionController.getMonthlyAll);

export default router;
