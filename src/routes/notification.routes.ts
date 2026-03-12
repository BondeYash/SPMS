import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { requireAuth } from "../middlewares/auth";

const router = Router();
const controller = new NotificationController();

router.get("/", requireAuth, controller.getUnread);
router.patch("/:id/read", requireAuth, controller.markRead);

export default router;

