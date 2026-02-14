"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const worker_routes_1 = __importDefault(require("./worker.routes"));
const sheettype_routes_1 = __importDefault(require("./sheettype.routes"));
const production_routes_1 = __importDefault(require("./production.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.Router)();
router.use("/workers", worker_routes_1.default);
router.use("/sheets", sheettype_routes_1.default);
router.use("/production", production_routes_1.default);
router.use("/auth", auth_routes_1.default);
exports.default = router;
