import { AppDataSource } from "../config/data-source";
import { ProductionEntry } from "../entities/ProductionEntry";
import { CreateProductionDto } from "../dto/CreateProduction.dto";
import { Worker } from "../entities/Worker";
import { SheetType } from "../entities/SheetType";
import { Between, Repository } from "typeorm";

export class ProductionService {
    private productionRepository = AppDataSource.getRepository(ProductionEntry);
    private workerRepository = AppDataSource.getRepository(Worker);
    private sheetTypeRepository = AppDataSource.getRepository(SheetType);

    private formatDate(date: any): string {
        if (!date) return "";
        if (date instanceof Date) {
            return date.toISOString().split("T")[0];
        }
        if (typeof date === "string" && date.includes("T")) {
            return date.split("T")[0];
        }
        return String(date);
    }

    async createProductionEntry(data: CreateProductionDto): Promise<ProductionEntry[]> {
        const { workerId, date, entries } = data;
        console.log(`[ProductionService.createProductionEntry] Creating entry for workerId: ${workerId}, date: ${date}`);

        // 1. Verify Worker exists
        const worker = await this.workerRepository.findOneBy({ id: workerId });
        if (!worker) {
            throw new Error("Worker not found");
        }

        // Normalize date to YYYY-MM-DD format
        const normalizedDate = this.formatDate(date);
        console.log(`[ProductionService.createProductionEntry] Normalized date: ${normalizedDate}`);

        // 2. Check for Duplicate Entry (One submission per day Rule)
        const existingEntry = await this.productionRepository.findOne({
            where: { workerId, date: normalizedDate },
        });

        if (existingEntry) {
            throw new Error("Worker has already submitted production for this date.");
        }

        // 3. Prepare entries
        const productionEntries: ProductionEntry[] = [];

        for (const item of entries) {
            const sheetType = await this.sheetTypeRepository.findOneBy({ id: item.sheetTypeId });
            if (!sheetType) {
                throw new Error(`SheetType with ID ${item.sheetTypeId} not found`);
            }

            const entry = new ProductionEntry();
            entry.worker = worker;
            entry.date = normalizedDate;
            entry.sheetType = sheetType;
            entry.quantity = item.quantity;
            productionEntries.push(entry);
        }

        console.log(`[ProductionService.createProductionEntry] Saving ${productionEntries.length} entries`);
        const saved = await this.productionRepository.save(productionEntries);
        console.log(`[ProductionService.createProductionEntry] Successfully saved entries`);
        return saved;
    }

    /**
     * Returns worker history grouped by date (one object per day),
     * each with items[], totalSheets, totalEarnings, and productionDate.
     */
    async getWorkerHistory(workerId: string): Promise<any[]> {
        const rawEntries = await this.productionRepository.find({
            where: { workerId },
            relations: ["sheetType"],
            order: { date: "DESC" },
        });

        // Group by date
        const dateMap = new Map<string, any>();

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

            const group = dateMap.get(dateKey)!;
            const qty = Number(entry.quantity);
            const price = Number(entry.sheetType?.pricePerUnit ?? 0);
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
    }

    // Analytics: Total sheets and earnings in a day (across all workers)
    async getDailyStats(date: string) {
        // Ensure input date is also normalized if it's coming from an inconsistent source
        const targetDate = this.formatDate(date);
        const entries = await this.productionRepository.find({
            where: { date: targetDate },
            relations: ["sheetType", "worker"],
        });

        let totalSheets = 0;
        let totalEarnings = 0;

        const workerMap = new Map<string, { workerId: string; workerName: string; sheets: number; earnings: number }>();

        entries.forEach(entry => {
            const qty = Number(entry.quantity);
            const price = Number(entry.sheetType?.pricePerUnit ?? 0);
            totalSheets += qty;
            totalEarnings += qty * price;

            const wId = entry.workerId;
            const prev = workerMap.get(wId) || { workerId: wId, workerName: entry.worker?.name ?? wId, sheets: 0, earnings: 0 };
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
    }

    /**
     * Monthly stats for a single worker.
     * Returns shape expected by frontend: workingDays, totalSheets, totalEarnings, averagePerDay, dailyBreakdown[]
     */
    async getMonthlyWorkerStats(workerId: string, year: number, month: number) {
        const lastDay = new Date(year, month, 0).getDate();
        const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const rawEntries = await this.productionRepository.find({
            where: {
                workerId,
                date: Between(startStr, endStr),
            },
            relations: ["sheetType"],
            order: { date: "ASC" },
        });

        // Group by date for dailyBreakdown
        const dayMap = new Map<string, { date: string; sheets: number; earnings: number }>();

        let totalSheets = 0;
        let totalEarnings = 0;

        for (const entry of rawEntries) {
            const qty = Number(entry.quantity);
            const price = Number(entry.sheetType?.pricePerUnit ?? 0);
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
    }

    // Admin: earnings for ALL workers for a month
    async getMonthlyEarningsAll(year: number, month: number) {
        const lastDay = new Date(year, month, 0).getDate();
        const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        console.log(`[ProductionService.getMonthlyEarningsAll] Fetching for year: ${year}, month: ${month}`);
        console.log(`[ProductionService.getMonthlyEarningsAll] Date range: ${startStr} to ${endStr}`);

        const entries = await this.productionRepository.find({
            where: { date: Between(startStr, endStr) },
            relations: ["sheetType", "worker"],
        });

        console.log(`[ProductionService.getMonthlyEarningsAll] Found ${entries.length} entries`);

        const map = new Map<string, { workerId: string; workerName: string; totalSheets: number; totalEarnings: number }>();

        entries.forEach(entry => {
            console.log(`[ProductionService.getMonthlyEarningsAll] Entry: workerId=${entry.workerId}, date=${entry.date}, qty=${entry.quantity}`);
            const w = entry.workerId;
            const qty = Number(entry.quantity ?? 0);
            const price = Number(entry.sheetType?.pricePerUnit ?? 0);
            const val = map.get(w) || { workerId: w, workerName: entry.worker?.name ?? w, totalSheets: 0, totalEarnings: 0 };
            val.totalSheets += qty;
            val.totalEarnings += qty * price;
            map.set(w, val);
        });

        const result = Array.from(map.values()).map(v => ({
            ...v,
            totalEarnings: v.totalEarnings.toFixed(2),
        }));

        console.log(`[ProductionService.getMonthlyEarningsAll] Returning ${result.length} worker summaries`);
        return result;
    }

    async getYearlyWorkerStats(workerId: string, year: number) {
        const startStr = `${year}-01-01`;
        const endStr = `${year}-12-31`;

        const entries = await this.productionRepository.find({
            where: {
                workerId,
                date: Between(startStr, endStr),
            },
            relations: ["sheetType"],
        });

        let totalEarnings = 0;
        let totalSheets = 0;

        entries.forEach(entry => {
            totalSheets += Number(entry.quantity);
            totalEarnings += Number(entry.quantity) * Number(entry.sheetType?.pricePerUnit ?? 0);
        });

        return {
            workerId,
            year,
            totalSheets,
            totalEarnings: totalEarnings.toFixed(2),
        };
    }
}