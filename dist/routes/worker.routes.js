"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WorkerController_1 = require("../controllers/WorkerController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const workerController = new WorkerController_1.WorkerController();
// Only admin can create workers and view the list
router.post("/create-worker", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), workerController.create);
router.get("/get-worker", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), workerController.getAll);
// Admin: lookup worker by short human-friendly code
router.get("/by-code/:code", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), workerController.getByCode);
exports.default = router;
