"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionController = void 0;
const ProductionService_1 = require("../services/ProductionService");
const CreateProduction_dto_1 = require("../dto/CreateProduction.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ProductionController {
    constructor() {
        this.productionService = new ProductionService_1.ProductionService();
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Ensure workerId comes from authenticated user (token)
            const body = Object.assign(Object.assign({}, req.body), { workerId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
            const dto = (0, class_transformer_1.plainToInstance)(CreateProduction_dto_1.CreateProductionDto, body);
            const errors = yield (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }
            try {
                const entries = yield this.productionService.createProductionEntry(dto);
                res.status(201).json({ message: "Production submitted successfully", count: entries.length, entries });
            }
            catch (error) {
                if (error.message === "Worker not found" || error.message.includes("SheetType")) {
                    res.status(404).json({ message: error.message });
                }
                else if (error.message.includes("already submitted")) {
                    res.status(409).json({ message: error.message }); // 409 Conflict for duplicate
                }
                else {
                    res.status(500).json({ message: "Error submitting production", error: error.message });
                }
            }
        });
        this.getMyHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const workerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!workerId) {
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                const history = yield this.productionService.getWorkerHistory(workerId);
                res.json(history);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching history", error });
            }
        });
        this.getHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { workerId } = req.params;
            try {
                const history = yield this.productionService.getWorkerHistory(workerId);
                res.json(history);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching history", error });
            }
        });
        this.getDailyStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { date } = req.query; // ?date=YYYY-MM-DD
            if (!date || typeof date !== "string") {
                res.status(400).json({ message: "Date query parameter is required (YYYY-MM-DD)" });
                return;
            }
            try {
                const stats = yield this.productionService.getDailyStats(date);
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching daily stats", error });
            }
        });
        this.getMonthlyStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { workerId, year, month } = req.params;
            if (!workerId || !year || !month) {
                res.status(400).json({ message: "Missing parameters: workerId, year, month" });
                return;
            }
            try {
                const stats = yield this.productionService.getMonthlyWorkerStats(workerId, Number(year), Number(month));
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching monthly stats", error });
            }
        });
        // Worker: get own monthly stats
        this.getMyMonthlyStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const workerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { year, month } = req.params;
                if (!workerId) {
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                if (!year || !month) {
                    res.status(400).json({ message: "Missing parameters: year, month" });
                    return;
                }
                const stats = yield this.productionService.getMonthlyWorkerStats(workerId, Number(year), Number(month));
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching monthly stats", error });
            }
        });
        // Admin: get monthly earnings for all workers
        this.getMonthlyAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { year, month } = req.params;
                if (!year || !month) {
                    res.status(400).json({ message: "Missing parameters: year, month" });
                    return;
                }
                const stats = yield this.productionService.getMonthlyEarningsAll(Number(year), Number(month));
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching monthly earnings for all workers", error });
            }
        });
        this.getYearlyStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { workerId, year } = req.params;
            try {
                const stats = yield this.productionService.getYearlyWorkerStats(workerId, Number(year));
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching yearly stats", error });
            }
        });
    }
}
exports.ProductionController = ProductionController;
