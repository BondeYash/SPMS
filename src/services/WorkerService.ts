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
}
