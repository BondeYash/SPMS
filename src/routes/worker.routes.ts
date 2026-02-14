import { Router } from "express";
import { WorkerController } from "../controllers/WorkerController";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
const workerController = new WorkerController();

// Only admin can create workers and view the list
router.post("/create-worker", requireAuth, requireRole("admin"), workerController.create);
router.get("/get-worker", requireAuth, requireRole("admin"), workerController.getAll);

// Admin: lookup worker by short human-friendly code
router.get("/by-code/:code", requireAuth, requireRole("admin"), workerController.getByCode);

export default router;
