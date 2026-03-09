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
/** Maps internal Worker entity to a safe public shape for the frontend */
function mapWorker(w) {
    var _a;
    return {
        id: w.id,
        name: w.name,
        email: w.email,
        // Frontend expects `phone` field, map DB `contact` to `phone` for compatibility
        phone: w.contact ? String(w.contact) : null,
        isActive: true,
        role: (_a = w.role) !== null && _a !== void 0 ? _a : "worker",
        createdAt: w.createdAt,
    };
}
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
                const created = yield this.authService.registerWorker({
                    name: dto.name,
                    email: dto.email,
                    password: dto.password,
                    contact: dto.contact,
                    role: dto.role,
                });
                res.status(201).json(mapWorker(created));
            }
            catch (error) {
                res.status(500).json({ message: "Error creating worker", error: error.message || error });
            }
        });
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const workers = yield this.workerService.getAllWorkers();
                res.json(workers.map(mapWorker));
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching workers", error });
            }
        });
        this.getWorkerById = (req, res, id) => __awaiter(this, void 0, void 0, function* () {
            try {
                const worker = yield this.workerService.getWorkerById(id);
                if (!worker) {
                    res.status(404).json({ message: "Worker not found" });
                    return;
                }
                res.json(mapWorker(worker));
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
                res.json(mapWorker(worker));
            }
            catch (err) {
                res.status(500).json({ message: "Error fetching worker by code", error: err });
            }
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const data = req.body;
            try {
                // Log incoming payload for troubleshooting (safe in dev; remove or sanitize in prod)
                console.debug('[WorkerController.update] id=', id, 'body=', data);
                // Accept `phone` from the frontend (legacy name) and map to `contact` which is the DB column.
                if (data && Object.prototype.hasOwnProperty.call(data, 'phone')) {
                    const parsed = Number(data.phone);
                    data.contact = Number.isNaN(parsed) ? null : parsed;
                    delete data.phone;
                }
                else if (data && Object.prototype.hasOwnProperty.call(data, 'contact')) {
                    const parsed = Number(data.contact);
                    data.contact = Number.isNaN(parsed) ? null : parsed;
                }
                // Build a sanitized update object with only allowed fields to avoid passing
                // unexpected properties (like `isActive`) to TypeORM's update which causes
                // EntityPropertyNotFoundError.
                const allowed = ['name', 'email', 'contact', 'password', 'role', 'shortId'];
                const toUpdate = {};
                if (data && typeof data === 'object') {
                    for (const key of allowed) {
                        if (Object.prototype.hasOwnProperty.call(data, key)) {
                            toUpdate[key] = data[key];
                        }
                    }
                }
                const updated = yield this.workerService.updateWorker(id, toUpdate);
                if (!updated) {
                    res.status(404).json({ message: "Worker not found" });
                    return;
                }
                res.json(mapWorker(updated));
            }
            catch (error) {
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
        });
        this.delete = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const success = yield this.workerService.deleteWorker(id);
                if (!success) {
                    res.status(404).json({ message: "Worker not found" });
                    return;
                }
                res.json({ message: "Worker deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Error deleting worker", error: error.message || error });
            }
        });
    }
}
exports.WorkerController = WorkerController;
