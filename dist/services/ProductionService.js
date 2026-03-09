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
    formatDate(date) {
        if (!date)
            return "";
        if (date instanceof Date) {
            return date.toISOString().split("T")[0];
        }
        if (typeof date === "string" && date.includes("T")) {
            return date.split("T")[0];
        }
        return String(date);
    }
    createProductionEntry(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workerId, date, entries } = data;
            console.log(`[ProductionService.createProductionEntry] Creating entry for workerId: ${workerId}, date: ${date}`);
            // 1. Verify Worker exists
            const worker = yield this.workerRepository.findOneBy({ id: workerId });
            if (!worker) {
                throw new Error("Worker not found");
            }
            // Normalize date to YYYY-MM-DD format
            const normalizedDate = this.formatDate(date);
            console.log(`[ProductionService.createProductionEntry] Normalized date: ${normalizedDate}`);
            // 2. Check for Duplicate Entry (One submission per day Rule)
            const existingEntry = yield this.productionRepository.findOne({
                where: { workerId, date: normalizedDate },
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
                entry.date = normalizedDate;
                entry.sheetType = sheetType;
                entry.quantity = item.quantity;
                productionEntries.push(entry);
            }
            console.log(`[ProductionService.createProductionEntry] Saving ${productionEntries.length} entries`);
            const saved = yield this.productionRepository.save(productionEntries);
            console.log(`[ProductionService.createProductionEntry] Successfully saved entries`);
            return saved;
        });
    }
    /**
     * Returns worker history grouped by date (one object per day),
     * each with items[], totalSheets, totalEarnings, and productionDate.
     */
    getWorkerHistory(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const rawEntries = yield this.productionRepository.find({
                where: { workerId },
                relations: ["sheetType"],
                order: { date: "DESC" },
            });
            // Group by date
            const dateMap = new Map();
            for (const entry of rawEntries) {
                const dateKey = this.formatDate(entry.date);
                if (!dateMap.has(dateKey)) {
                    dateMap.set(dateKey, {
                        id: `${workerId}-${dateKey}`,
                        workerId,
                        productionDate: dateKey,
                        totalSheets: 0,
                        totalEarnings: "0",
                        notes: null,
                        createdAt: entry.createdAt,
                        items: [],
                    });
                }
                const group = dateMap.get(dateKey);
                const qty = Number(entry.quantity);
                const price = Number((_b = (_a = entry.sheetType) === null || _a === void 0 ? void 0 : _a.pricePerUnit) !== null && _b !== void 0 ? _b : 0);
                const lineTotal = qty * price;
                group.totalSheets += qty;
                group.totalEarnings = (Number(group.totalEarnings) + lineTotal).toFixed(2);
                group.items.push({
                    sheetTypeId: entry.sheetTypeId,
                    quantity: qty,
                    pricePerUnit: price.toFixed(2),
                    lineTotal: lineTotal.toFixed(2),
                    sheetType: entry.sheetType
                        ? {
                            name: entry.sheetType.name,
                            code: entry.sheetType.code,
                            pricePerUnit: price.toFixed(2),
                        }
                        : null,
                });
            }
            return Array.from(dateMap.values());
        });
    }
    // Analytics: Total sheets and earnings in a day (across all workers)
    getDailyStats(date) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure input date is also normalized if it's coming from an inconsistent source
            const targetDate = this.formatDate(date);
            const entries = yield this.productionRepository.find({
                where: { date: targetDate },
                relations: ["sheetType", "worker"],
            });
            let totalSheets = 0;
            let totalEarnings = 0;
            const workerMap = new Map();
            entries.forEach(entry => {
                var _a, _b, _c, _d;
                const qty = Number(entry.quantity);
                const price = Number((_b = (_a = entry.sheetType) === null || _a === void 0 ? void 0 : _a.pricePerUnit) !== null && _b !== void 0 ? _b : 0);
                totalSheets += qty;
                totalEarnings += qty * price;
                const wId = entry.workerId;
                const prev = workerMap.get(wId) || { workerId: wId, workerName: (_d = (_c = entry.worker) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : wId, sheets: 0, earnings: 0 };
                prev.sheets += qty;
                prev.earnings += qty * price;
                workerMap.set(wId, prev);
            });
            return {
                date,
                totalSheets,
                totalEarnings: totalEarnings.toFixed(2),
                workerBreakdown: Array.from(workerMap.values()),
            };
        });
    }
    /**
     * Monthly stats for a single worker.
     * Returns shape expected by frontend: workingDays, totalSheets, totalEarnings, averagePerDay, dailyBreakdown[]
     */
    getMonthlyWorkerStats(workerId, year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const lastDay = new Date(year, month, 0).getDate();
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const rawEntries = yield this.productionRepository.find({
                where: {
                    workerId,
                    date: (0, typeorm_1.Between)(startStr, endStr),
                },
                relations: ["sheetType"],
                order: { date: "ASC" },
            });
            // Group by date for dailyBreakdown
            const dayMap = new Map();
            let totalSheets = 0;
            let totalEarnings = 0;
            for (const entry of rawEntries) {
                const qty = Number(entry.quantity);
                const price = Number((_b = (_a = entry.sheetType) === null || _a === void 0 ? void 0 : _a.pricePerUnit) !== null && _b !== void 0 ? _b : 0);
                const earn = qty * price;
                totalSheets += qty;
                totalEarnings += earn;
                const dateKey = this.formatDate(entry.date);
                const prev = dayMap.get(dateKey) || { date: dateKey, sheets: 0, earnings: 0 };
                prev.sheets += qty;
                prev.earnings += earn;
                dayMap.set(dateKey, prev);
            }
            const workingDays = dayMap.size;
            const averagePerDay = workingDays > 0 ? totalEarnings / workingDays : 0;
            const dailyBreakdown = Array.from(dayMap.values()).map(d => ({
                date: d.date,
                sheets: d.sheets,
                earnings: d.earnings.toFixed(2),
            }));
            return {
                workerId,
                year,
                month,
                totalSheets,
                totalEarnings: totalEarnings.toFixed(2),
                workingDays,
                averagePerDay: averagePerDay.toFixed(2),
                dailyBreakdown,
            };
        });
    }
    // Admin: earnings for ALL workers for a month
    getMonthlyEarningsAll(year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            const lastDay = new Date(year, month, 0).getDate();
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            console.log(`[ProductionService.getMonthlyEarningsAll] Fetching for year: ${year}, month: ${month}`);
            console.log(`[ProductionService.getMonthlyEarningsAll] Date range: ${startStr} to ${endStr}`);
            const entries = yield this.productionRepository.find({
                where: { date: (0, typeorm_1.Between)(startStr, endStr) },
                relations: ["sheetType", "worker"],
            });
            console.log(`[ProductionService.getMonthlyEarningsAll] Found ${entries.length} entries`);
            const map = new Map();
            entries.forEach(entry => {
                var _a, _b, _c, _d, _e;
                console.log(`[ProductionService.getMonthlyEarningsAll] Entry: workerId=${entry.workerId}, date=${entry.date}, qty=${entry.quantity}`);
                const w = entry.workerId;
                const qty = Number((_a = entry.quantity) !== null && _a !== void 0 ? _a : 0);
                const price = Number((_c = (_b = entry.sheetType) === null || _b === void 0 ? void 0 : _b.pricePerUnit) !== null && _c !== void 0 ? _c : 0);
                const val = map.get(w) || { workerId: w, workerName: (_e = (_d = entry.worker) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : w, totalSheets: 0, totalEarnings: 0 };
                val.totalSheets += qty;
                val.totalEarnings += qty * price;
                map.set(w, val);
            });
            const result = Array.from(map.values()).map(v => (Object.assign(Object.assign({}, v), { totalEarnings: v.totalEarnings.toFixed(2) })));
            console.log(`[ProductionService.getMonthlyEarningsAll] Returning ${result.length} worker summaries`);
            return result;
        });
    }
    getYearlyWorkerStats(workerId, year) {
        return __awaiter(this, void 0, void 0, function* () {
            const startStr = `${year}-01-01`;
            const endStr = `${year}-12-31`;
            const entries = yield this.productionRepository.find({
                where: {
                    workerId,
                    date: (0, typeorm_1.Between)(startStr, endStr),
                },
                relations: ["sheetType"],
            });
            let totalEarnings = 0;
            let totalSheets = 0;
            entries.forEach(entry => {
                var _a, _b;
                totalSheets += Number(entry.quantity);
                totalEarnings += Number(entry.quantity) * Number((_b = (_a = entry.sheetType) === null || _a === void 0 ? void 0 : _a.pricePerUnit) !== null && _b !== void 0 ? _b : 0);
            });
            return {
                workerId,
                year,
                totalSheets,
                totalEarnings: totalEarnings.toFixed(2),
            };
        });
    }
}
exports.ProductionService = ProductionService;
