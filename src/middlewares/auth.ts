import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: string; email?: string };
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization as string | undefined;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.split(" ")[1];
    try {
        const payload: any = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.sub, role: payload.role, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export function requireRole(role: "admin" | "worker") {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role !== role) return res.status(403).json({ message: "Forbidden" });
        next();
    };
}

export function requireWorkerOwns(paramWorkerIdField = "workerId") {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role === "admin") return next();
        const workerId = (req.params as any)[paramWorkerIdField] || (req.body && (req.body as any).workerId);
        if (!workerId) return res.status(400).json({ message: "Missing workerId" });
        if (workerId !== req.user.id) return res.status(403).json({ message: "Forbidden - can only operate on own resources" });
        next();
    };
}

export default {}
