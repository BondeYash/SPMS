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

    async createProductionEntry(data: CreateProductionDto): Promise<ProductionEntry[]> {
        const { workerId, date, entries } = data;

        // 1. Verify Worker exists
        const worker = await this.workerRepository.findOneBy({ id: workerId });
        if (!worker) {
            throw new Error("Worker not found");
        }

        // 2. Check for Duplicate Entry (One submission per day Rule)
        // We check if ANY entry exists for this worker on this date.
        const existingEntry = await this.productionRepository.findOne({
            where: {
                workerId,
                date,
            },
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
            entry.date = date;
            entry.sheetType = sheetType;
            entry.quantity = item.quantity;
            productionEntries.push(entry);
        }

        // 4. Save all in a transaction (optional but good for data integrity)
        // For simplicity using save method which handles array efficiently
        return this.productionRepository.save(productionEntries);
    }

    async getWorkerHistory(workerId: string): Promise<ProductionEntry[]> {
        return this.productionRepository.find({
            where: { workerId },
            relations: ["sheetType"],
            order: { date: "DESC" },
        });
    }

    // Analytics: Total sheets and earnings in a day
    async getDailyStats(date: string) {
        const entries = await this.productionRepository.find({
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
    }

    // Analytics: Total earnings in a selected month for a worker
    async getMonthlyWorkerStats(workerId: string, year: number, month: number) {
        // Construct date range for the month
        // Month is 1-indexed (1 = January, 12 = December)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month

        // Format to YYYY-MM-DD for string query if needed, or use Between with strings
        // Since we stored date as string YYYY-MM-DD
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const entries = await this.productionRepository.find({
            where: {
                workerId,
                date: Between(startStr, endStr)
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
    }

    // Optional: admin helper to get earnings of all workers for a month
    async getMonthlyEarningsAll(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const entries = await this.productionRepository.find({
            where: { date: Between(startStr, endStr) },
            relations: ["sheetType"],
        });

        const map = new Map<string, { workerId: string; totalSheets: number; totalEarnings: number }>();

        entries.forEach(entry => {
            const w = (entry as any).workerId as string;
            const qty = Number(entry.quantity || 0);
            const price = Number(entry.sheetType?.price || 0);
            const val = map.get(w) || { workerId: w, totalSheets: 0, totalEarnings: 0 };
            val.totalSheets += qty;
            val.totalEarnings += qty * price;
            map.set(w, val);
        });

        return Array.from(map.values());
    }

    async getYearlyWorkerStats(workerId: string, year: number) {
        const startDate = new Date(year, 0, 1); // January 1st
        const endDate = new Date(year + 1, 0, 1); // January 1st of next year

        const entries = await this.productionRepository.find({
            where: {
                workerId,
                date: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
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
    }
}