"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SheetTypeController_1 = require("../controllers/SheetTypeController");
const auth_1 = require("../middlewares/auth");
const checkAttendance_1 = require("../middlewares/checkAttendance");
const router = (0, express_1.Router)();
const sheetTypeController = new SheetTypeController_1.SheetTypeController();
// Only admin can create sheet types
router.post("/create-sheet-type", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), sheetTypeController.create);
// Admins and workers can view active sheet types
router.get("/get-sheet-type", auth_1.requireAuth, checkAttendance_1.checkAttendance, sheetTypeController.getAll);
exports.default = router;
