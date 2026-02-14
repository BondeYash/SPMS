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
exports.ProductionService = void 0;
const data_source_1 = require("../config/data-source");
const ProductionEntry_1 = require("../entities/ProductionEntry");
const Worker_1 = require("../entities/Worker");
const SheetType_1 = require("../entities/SheetType");
const typeorm_1 = require("typeorm");
class ProductionService {
    constructor() {
        this.productionRepository = data_source_1.AppDataSource.getRepository(ProductionEntry_1.ProductionEntry);
        this.workerRepository = data_source_1.AppDataSource.getRepository(Worker_1.Worker);
        this.sheetTypeRepository = data_source_1.AppDataSource.getRepository(SheetType_1.SheetType);
    }
    createProductionEntry(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workerId, date, entries } = data;
            // 1. Verify Worker exists
            const worker = yield this.workerRepository.findOneBy({ id: workerId });
            if (!worker) {
                throw new Error("Worker not found");
            }
            // 2. Check for Duplicate Entry (One submission per day Rule)
            // We check if ANY entry exists for this worker on this date.
            const existingEntry = yield this.productionRepository.findOne({
                where: {
                    workerId,
                    date,
                },
            });
            if (existingEntry) {
                throw new Error("Worker has already submitted production for this date.");
            }
            // 3. Prepare entries
            const productionEntries = [];
            for (const item of entries) {
                const sheetType = yield this.sheetTypeRepository.findOneBy({ id: item.sheetTypeId });
                if (!sheetType) {
                    throw new Error(`SheetType with ID ${item.sheetTypeId} not found`);
                }
                const entry = new ProductionEntry_1.ProductionEntry();
                entry.worker = worker;
                entry.date = date;
                entry.sheetType = sheetType;
                entry.quantity = item.quantity;
                productionEntries.push(entry);
            }
            // 4. Save all in a transaction (optional but good for data integrity)
            // For simplicity using save method which handles array efficiently
            return this.productionRepository.save(productionEntries);
        });
    }
    getWorkerHistory(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.productionRepository.find({
                where: { workerId },
                relations: ["sheetType"],
                order: { date: "DESC" },
            });
        });
    }
    // Analytics: Total sheets and earnings in a day
    getDailyStats(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this.productionRepository.find({
                where: { date },
                relations: ["sheetType"],
            });
            let totalSheets = 0;
            let totalEarnings = 0;
            entries.forEach(entry => {
                totalSheets += entry.quantity;
                totalEarnings += entry.quantity * Number(entry.sheetType.price);
            });
            return {
                date,
                totalSheets,
                totalEarnings,
                details: entries
            };
        });
    }
    // Analytics: Total earnings in a selected month for a worker
    getMonthlyWorkerStats(workerId, year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            // Construct date range for the month
            // Month is 1-indexed (1 = January, 12 = December)
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month
            // Format to YYYY-MM-DD for string query if needed, or use Between with strings
            // Since we stored date as string YYYY-MM-DD
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            const entries = yield this.productionRepository.find({
                where: {
                    workerId,
                    date: (0, typeorm_1.Between)(startStr, endStr)
                },
                relations: ["sheetType"]
            });
            let totalEarnings = 0;
            let totalSheets = 0;
            entries.forEach(entry => {
                totalSheets += entry.quantity;
                totalEarnings += entry.quantity * Number(entry.sheetType.price);
            });
            return {
                workerId,
                year,
                month,
                totalSheets,
                totalEarnings,
                details: entries,
            };
        });
    }
    // Optional: admin helper to get earnings of all workers for a month
    getMonthlyEarningsAll(year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            const entries = yield this.productionRepository.find({
                where: { date: (0, typeorm_1.Between)(startStr, endStr) },
                relations: ["sheetType"],
            });
            const map = new Map();
            entries.forEach(entry => {
                var _a;
                const w = entry.workerId;
                const qty = Number(entry.quantity || 0);
                const price = Number(((_a = entry.sheetType) === null || _a === void 0 ? void 0 : _a.price) || 0);
                const val = map.get(w) || { workerId: w, totalSheets: 0, totalEarnings: 0 };
                val.totalSheets += qty;
                val.totalEarnings += qty * price;
                map.set(w, val);
            });
            return Array.from(map.values());
        });
    }
    getYearlyWorkerStats(workerId, year) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(year, 0, 1); // January 1st
            const endDate = new Date(year + 1, 0, 1); // January 1st of next year
            const entries = yield this.productionRepository.find({
                where: {
                    workerId,
                    date: (0, typeorm_1.Between)(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
                },
                relations: ["sheetType"]
            });
            let totalEarnings = 0;
            let totalSheets = 0;
            entries.forEach(entry => {
                totalSheets += entry.quantity;
                totalEarnings += entry.quantity * Number(entry.sheetType.price);
            });
            return {
                workerId,
                year,
                totalSheets,
                totalEarnings,
            };
        });
    }
}
exports.ProductionService = ProductionService;
