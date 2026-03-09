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
exports.WorkerService = void 0;
const data_source_1 = require("../config/data-source");
const Worker_1 = require("../entities/Worker");
class WorkerService {
    constructor() {
        this.workerRepository = data_source_1.AppDataSource.getRepository(Worker_1.Worker);
    }
    createWorker(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const worker = this.workerRepository.create(data);
            return this.workerRepository.save(worker);
        });
    }
    getAllWorkers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.workerRepository.find();
        });
    }
    getWorkerById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.workerRepository.findOneBy({ id });
        });
    }
    getWorkerByShortId(code) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.workerRepository.findOneBy({ shortId: code });
        });
    }
    updateWorker(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent unique constraint DB errors by checking for email/shortId collisions first
            if (data.email) {
                const existing = yield this.workerRepository.findOneBy({ email: data.email });
                if (existing && existing.id !== id) {
                    const err = new Error('Email already in use by another worker');
                    err.code = 'EMAIL_CONFLICT';
                    throw err;
                }
            }
            if (data.shortId) {
                const existingShort = yield this.workerRepository.findOneBy({ shortId: data.shortId });
                if (existingShort && existingShort.id !== id) {
                    const err = new Error('ShortId already in use by another worker');
                    err.code = 'SHORTID_CONFLICT';
                    throw err;
                }
            }
            yield this.workerRepository.update(id, data);
            return this.getWorkerById(id);
        });
    }
    deleteWorker(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.workerRepository.delete(id);
            return (result.affected || 0) > 0;
        });
    }
}
exports.WorkerService = WorkerService;
