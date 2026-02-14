"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SheetTypeController_1 = require("../controllers/SheetTypeController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const sheetTypeController = new SheetTypeController_1.SheetTypeController();
// Only admin can create sheet types
router.post("/create-sheet-type", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), sheetTypeController.create);
router.get("/get-sheet-type", sheetTypeController.getAll);
exports.default = router;
