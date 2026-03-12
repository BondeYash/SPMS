import { Router } from "express";
import { SheetTypeController } from "../controllers/SheetTypeController";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
const sheetTypeController = new SheetTypeController();

// Only admin can create sheet types
router.post(
  "/create-sheet-type",
  requireAuth,
  requireRole("admin"),
  sheetTypeController.create
);

// Admins and workers can view active sheet types without attendance gating
router.get(
  "/get-sheet-type",
  requireAuth,
  sheetTypeController.getAll
);

export default router;
