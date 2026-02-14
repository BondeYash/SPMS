"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductionController_1 = require("../controllers/ProductionController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const productionController = new ProductionController_1.ProductionController();
// Worker creates production (authenticated worker)
router.post("/create-production", auth_1.requireAuth, (0, auth_1.requireRole)("worker"), productionController.create);
// Worker gets own history
router.get("/history/me", auth_1.requireAuth, (0, auth_1.requireRole)("worker"), productionController.getMyHistory);
// Admin gets history of a specific worker
router.get("/history/:workerId", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), productionController.getHistory);
// Get stats for a specific day (Query param: ?date=YYYY-MM-DD) - accessible to admins
router.get("/stats/daily", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), productionController.getDailyStats);
// Get monthly stats for a worker - admin only (keeps existing behavior)
router.get("/stats/monthly/:workerId/:year/:month", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), productionController.getMonthlyStats);
// Worker: view own monthly earnings
router.get("/stats/monthly/me/:year/:month", auth_1.requireAuth, (0, auth_1.requireRole)("worker"), productionController.getMyMonthlyStats);
// Admin: aggregate earnings for all workers for a month
router.get("/stats/monthly/all/:year/:month", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), productionController.getMonthlyAll);
exports.default = router;
