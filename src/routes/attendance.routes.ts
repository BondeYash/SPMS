import { Router } from "express";
import { AttendanceController } from "../controllers/AttendanceController";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
const controller = new AttendanceController();

router.post(
  "/time-in",
  requireAuth,
  requireRole("worker"),
  controller.timeIn
);

router.get(
  "/my-status",
  requireAuth,
  requireRole("worker"),
  controller.myStatus
);

router.get(
  "/my-calendar",
  requireAuth,
  requireRole("worker"),
  controller.myCalendar
);

router.get(
  "/pending",
  requireAuth,
  requireRole("admin"),
  controller.pending
);

router.get(
  "/recent-approved",
  requireAuth,
  requireRole("admin"),
  controller.recentApproved
);

router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("admin"),
  controller.approve
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("admin"),
  controller.reject
);

export default router;

