import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { Worker } from "../entities/Worker";
import { customAlphabet } from "nanoid";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export class AuthService {
    private workerRepo = AppDataSource.getRepository(Worker);

    async registerWorker(data: { name: string; email: string; password: string; contact?: number; role?: "admin" | "worker" }) {
        const existing = await this.workerRepo.findOneBy({ email: data.email });
        if (existing) throw new Error("Email Already Registered");

        const hashed = await bcrypt.hash(data.password, 10);

        // generate a short human-friendly id (6 chars) and ensure uniqueness
        const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // avoid ambiguous chars
        const nano = customAlphabet(alphabet, 6);
        let shortId = nano();
        let tries = 0;
        while (await this.workerRepo.findOneBy({ shortId })) {
            shortId = nano();
            tries++;
            if (tries > 10) break; // extremely unlikely
        }

        const worker = this.workerRepo.create({ name: data.name, email: data.email, password: hashed, contact: data.contact, role: data.role || "worker", shortId });
        const saved = await this.workerRepo.save(worker);
        // Do not return password
        // @ts-ignore
        delete saved.password;
        return saved;
    }

    async authenticate(email: string, password: string) {
        const user = await this.workerRepo.findOneBy({ email });
        if (!user) throw new Error("Invalid credentials");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error("Invalid credentials");

        const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "8h" });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    verifyToken(token: string) {
        return jwt.verify(token, JWT_SECRET);
    }
}