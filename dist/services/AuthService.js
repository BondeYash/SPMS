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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const Worker_1 = require("../entities/Worker");
const nanoid_1 = require("nanoid");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
class AuthService {
    constructor() {
        this.workerRepo = data_source_1.AppDataSource.getRepository(Worker_1.Worker);
    }
    registerWorker(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.workerRepo.findOneBy({ email: data.email });
            if (existing)
                throw new Error("Email Already Registered");
            const hashed = yield bcrypt_1.default.hash(data.password, 10);
            // generate a short human-friendly id (6 chars) and ensure uniqueness
            const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // avoid ambiguous chars
            const nano = (0, nanoid_1.customAlphabet)(alphabet, 6);
            let shortId = nano();
            let tries = 0;
            while (yield this.workerRepo.findOneBy({ shortId })) {
                shortId = nano();
                tries++;
                if (tries > 10)
                    break; // extremely unlikely
            }
            const worker = this.workerRepo.create({ name: data.name, email: data.email, password: hashed, contact: data.contact, role: data.role || "worker", shortId });
            const saved = yield this.workerRepo.save(worker);
            // Do not return password
            // @ts-ignore
            delete saved.password;
            return saved;
        });
    }
    authenticate(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.workerRepo.findOneBy({ email });
            if (!user)
                throw new Error("Invalid credentials");
            const ok = yield bcrypt_1.default.compare(password, user.password);
            if (!ok)
                throw new Error("Invalid credentials");
            const token = jsonwebtoken_1.default.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "8h" });
            return {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            };
        });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
}
exports.AuthService = AuthService;
