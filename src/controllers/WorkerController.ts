import { Request, Response } from "express";
import { WorkerService } from "../services/WorkerService";
import { CreateWorkerDto } from "../dto/CreateWorker.dto";
import { AuthService } from "../services/AuthService";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

/** Maps internal Worker entity to a safe public shape for the frontend */
function mapWorker(w: any) {
    return {
        id: w.id,
        name: w.name,
        email: w.email,
        // Frontend expects `phone` field, map DB `contact` to `phone` for compatibility
        phone: w.contact ? String(w.contact) : null,
        isActive: true,
        role: w.role ?? "worker",
        createdAt: w.createdAt,
    };
}

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
            const created = await this.authService.registerWorker({
                name: dto.name,
                email: dto.email,
                password: dto.password,
                contact: dto.contact,
                role: dto.role,
            });
            res.status(201).json(mapWorker(created));
        } catch (error: any) {
            res.status(500).json({ message: "Error creating worker", error: error.message || error });
        }
    };

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const workers = await this.workerService.getAllWorkers();
            res.json(workers.map(mapWorker));
        } catch (error) {
            res.status(500).json({ message: "Error fetching workers", error });
        }
    };

    getWorkerById = async (req: Request, res: Response, id: string): Promise<void> => {
        try {
            const worker = await this.workerService.getWorkerById(id);
            if (!worker) { res.status(404).json({ message: "Worker not found" }); return; }
            res.json(mapWorker(worker));
        } catch (err) {
            res.status(500).json({ message: "Error getting a Worker" });
        }
    };

    // Admin-only: lookup by short code
    getByCode = async (req: Request, res: Response): Promise<void> => {
        const { code } = req.params as any;
        try {
            const worker = await this.workerService.getWorkerByShortId(code);
            if (!worker) { res.status(404).json({ message: "Worker not found" }); return; }
            res.json(mapWorker(worker));
        } catch (err) {
            res.status(500).json({ message: "Error fetching worker by code", error: err });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const data = req.body;
        try {
            // Log incoming payload for troubleshooting (safe in dev; remove or sanitize in prod)
            console.debug('[WorkerController.update] id=', id, 'body=', data);
            // Accept `phone` from the frontend (legacy name) and map to `contact` which is the DB column.
            if (data && Object.prototype.hasOwnProperty.call(data, 'phone')) {
                const parsed = Number((data as any).phone);
                (data as any).contact = Number.isNaN(parsed) ? null : parsed;
                delete (data as any).phone;
            } else if (data && Object.prototype.hasOwnProperty.call(data, 'contact')) {
                const parsed = Number((data as any).contact);
                (data as any).contact = Number.isNaN(parsed) ? null : parsed;
            }

            // Build a sanitized update object with only allowed fields to avoid passing
            // unexpected properties (like `isActive`) to TypeORM's update which causes
            // EntityPropertyNotFoundError.
            const allowed = ['name', 'email', 'contact', 'password', 'role', 'shortId'];
            const toUpdate: any = {};
            if (data && typeof data === 'object') {
                for (const key of allowed) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        toUpdate[key] = (data as any)[key];
                    }
                }
            }

            const updated = await this.workerService.updateWorker(id as string, toUpdate);
            if (!updated) { res.status(404).json({ message: "Worker not found" }); return; }
            res.json(mapWorker(updated));
        } catch (error: any) {
            // Log full error for debugging
            console.error('[WorkerController.update] error updating worker:', error);
            // Return a bit more detail to help debugging (message and optional DB/code info)
            // Translate known service errors to appropriate HTTP status codes
            if (error.code === 'EMAIL_CONFLICT' || error.code === 'SHORTID_CONFLICT') {
                res.status(409).json({ message: error.message, code: error.code });
                return;
            }

            res.status(500).json({ message: "Error updating worker", error: error.message || error, code: error.code || null });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        try {
            const success = await this.workerService.deleteWorker(id as string);
            if (!success) { res.status(404).json({ message: "Worker not found" }); return; }
            res.json({ message: "Worker deleted successfully" });
        } catch (error: any) {
            res.status(500).json({ message: "Error deleting worker", error: error.message || error });
        }
    };
}
