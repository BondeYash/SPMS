import { Request, Response } from "express";
import { WorkerService } from "../services/WorkerService";
import { CreateWorkerDto } from "../dto/CreateWorker.dto";
import { AuthService } from "../services/AuthService";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

export class WorkerController {
    private workerService = new WorkerService();
    private authService = new AuthService();

    create = async (req: Request, res: Response): Promise<void> => {
        const dto = plainToInstance(CreateWorkerDto, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }

        try {
            // Use AuthService to ensure password is hashed and registration rules are followed
            const created = await this.authService.registerWorker({ name: dto.name, email: dto.email, password: dto.password, contact: dto.contact, role: dto.role });
            res.status(201).json(created);
        } catch (error: any) {
            res.status(500).json({ message: "Error creating worker", error: error.message || error });
        }
    };

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const workers = await this.workerService.getAllWorkers();
            res.json(workers);
        } catch (error) {
            res.status(500).json({ message: "Error fetching workers", error });
        }
    };

    getWorkerById = async (req: Request, res: Response, id: string): Promise<void> => {
        try {
            const worker = await this.workerService.getWorkerById(id);
            res.json(worker);
        }
        catch (err) {
            res.status(500).json({ message: "Error getting a Worker" })
        }
    }

    // Admin-only: lookup by short code
    getByCode = async (req: Request, res: Response): Promise<void> => {
        const { code } = req.params as any;
        try {
            const worker = await this.workerService.getWorkerByShortId(code);
            if (!worker) { res.status(404).json({ message: "Worker not found" }); return; }
            // hide password
            // @ts-ignore
            delete worker.password;
            res.json(worker);
        } catch (err) {
            res.status(500).json({ message: "Error fetching worker by code", error: err });
        }
    }
}
