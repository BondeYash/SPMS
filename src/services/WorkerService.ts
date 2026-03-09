import { AppDataSource } from "../config/data-source";
import { Worker } from "../entities/Worker";
import { CreateWorkerDto } from "../dto/CreateWorker.dto";

export class WorkerService {
    private workerRepository = AppDataSource.getRepository(Worker);



    async createWorker(data: CreateWorkerDto): Promise<Worker> {
        const worker = this.workerRepository.create(data);
        return this.workerRepository.save(worker);
    }

    async getAllWorkers(): Promise<Worker[]> {
        return this.workerRepository.find();
    }

    async getWorkerById(id: string): Promise<Worker | null> {
        return this.workerRepository.findOneBy({ id });
    }

    async getWorkerByShortId(code: string): Promise<Worker | null> {
        return this.workerRepository.findOneBy({ shortId: code });
    }

    async updateWorker(id: string, data: Partial<Worker>): Promise<Worker | null> {
        // Prevent unique constraint DB errors by checking for email/shortId collisions first
        if (data.email) {
            const existing = await this.workerRepository.findOneBy({ email: data.email });
            if (existing && existing.id !== id) {
                const err: any = new Error('Email already in use by another worker');
                err.code = 'EMAIL_CONFLICT';
                throw err;
            }
        }
        if ((data as any).shortId) {
            const existingShort = await this.workerRepository.findOneBy({ shortId: (data as any).shortId });
            if (existingShort && existingShort.id !== id) {
                const err: any = new Error('ShortId already in use by another worker');
                err.code = 'SHORTID_CONFLICT';
                throw err;
            }
        }

        await this.workerRepository.update(id, data);
        return this.getWorkerById(id);
    }

    async deleteWorker(id: string): Promise<boolean> {
        const result = await this.workerRepository.delete(id);
        return (result.affected || 0) > 0;
    }
}
