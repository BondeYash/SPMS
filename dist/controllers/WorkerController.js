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
exports.WorkerController = void 0;
const WorkerService_1 = require("../services/WorkerService");
const CreateWorker_dto_1 = require("../dto/CreateWorker.dto");
const AuthService_1 = require("../services/AuthService");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class WorkerController {
    constructor() {
        this.workerService = new WorkerService_1.WorkerService();
        this.authService = new AuthService_1.AuthService();
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = (0, class_transformer_1.plainToInstance)(CreateWorker_dto_1.CreateWorkerDto, req.body);
            const errors = yield (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }
            try {
                // Use AuthService to ensure password is hashed and registration rules are followed
                const created = yield this.authService.registerWorker({ name: dto.name, email: dto.email, password: dto.password, contact: dto.contact, role: dto.role });
                res.status(201).json(created);
            }
            catch (error) {
                res.status(500).json({ message: "Error creating worker", error: error.message || error });
            }
        });
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const workers = yield this.workerService.getAllWorkers();
                res.json(workers);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching workers", error });
            }
        });
        this.getWorkerById = (req, res, id) => __awaiter(this, void 0, void 0, function* () {
            try {
                const worker = yield this.workerService.getWorkerById(id);
                res.json(worker);
            }
            catch (err) {
                res.status(500).json({ message: "Error getting a Worker" });
            }
        });
        // Admin-only: lookup by short code
        this.getByCode = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code } = req.params;
            try {
                const worker = yield this.workerService.getWorkerByShortId(code);
                if (!worker) {
                    res.status(404).json({ message: "Worker not found" });
                    return;
                }
                // hide password
                // @ts-ignore
                delete worker.password;
                res.json(worker);
            }
            catch (err) {
                res.status(500).json({ message: "Error fetching worker by code", error: err });
            }
        });
    }
}
exports.WorkerController = WorkerController;
