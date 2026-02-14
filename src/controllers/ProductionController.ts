import { Request, Response } from "express";
import { ProductionService } from "../services/ProductionService";
import { CreateProductionDto } from "../dto/CreateProduction.dto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

export class ProductionController {
    private productionService = new ProductionService();

    create = async (req: Request, res: Response): Promise<void> => {
        // Ensure workerId comes from authenticated user (token)
        const body = { ...req.body, workerId: (req as any).user?.id };
        const dto = plainToInstance(CreateProductionDto, body);
        const errors = await validate(dto);

        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }

        try {
            const entries = await this.productionService.createProductionEntry(dto);
            res.status(201).json({ message: "Production submitted successfully", count: entries.length, entries });
        } catch (error: any) {
            if (error.message === "Worker not found" || error.message.includes("SheetType")) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes("already submitted")) {
                res.status(409).json({ message: error.message }); // 409 Conflict for duplicate
            } else {
                res.status(500).json({ message: "Error submitting production", error: error.message });
            }
        }
    };

    getMyHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const workerId = (req as any).user?.id;
            if (!workerId) { res.status(401).json({ message: "Unauthorized" }); return; }
            const history = await this.productionService.getWorkerHistory(workerId as string);
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: "Error fetching history", error });
        }
    };

    getHistory = async (req: Request, res: Response): Promise<void> => {
        const { workerId } = req.params;
        try {
            const history = await this.productionService.getWorkerHistory(workerId as string);
            res.json(history);
        } catch (error) {
            res.status(500).json({ message: "Error fetching history", error });
        }
    };

    getDailyStats = async (req: Request, res: Response): Promise<void> => {
        const { date } = req.query; // ?date=YYYY-MM-DD
        if (!date || typeof date !== "string") {
            res.status(400).json({ message: "Date query parameter is required (YYYY-MM-DD)" });
            return;
        }

        try {
            const stats = await this.productionService.getDailyStats(date);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Error fetching daily stats", error });
        }
    };

    getMonthlyStats = async (req: Request, res: Response): Promise<void> => {
        const { workerId, year, month } = req.params;

        if (!workerId || !year || !month) {
            res.status(400).json({ message: "Missing parameters: workerId, year, month" });
            return;
        }

        try {
            const stats = await this.productionService.getMonthlyWorkerStats(workerId as string, Number(year), Number(month));
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Error fetching monthly stats", error });
        }
    };

    // Worker: get own monthly stats
    getMyMonthlyStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const workerId = (req as any).user?.id;
            const { year, month } = req.params;
            if (!workerId) { res.status(401).json({ message: "Unauthorized" }); return; }
            if (!year || !month) { res.status(400).json({ message: "Missing parameters: year, month" }); return; }

            const stats = await this.productionService.getMonthlyWorkerStats(workerId as string, Number(year), Number(month));
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Error fetching monthly stats", error });
        }
    };

    // Admin: get monthly earnings for all workers
    getMonthlyAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const { year, month } = req.params;
            if (!year || !month) { res.status(400).json({ message: "Missing parameters: year, month" }); return; }

            const stats = await this.productionService.getMonthlyEarningsAll(Number(year), Number(month));
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: "Error fetching monthly earnings for all workers", error });
        }
    };

    getYearlyStats = async (req : Request , res : Response) : Promise<void> => {
        
        const {workerId , year} = req.params;

        try {
            const stats = await this.productionService.getYearlyWorkerStats(workerId as string , Number(year));
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({message : "Error fetching yearly stats" , error});
        }
    }
}
