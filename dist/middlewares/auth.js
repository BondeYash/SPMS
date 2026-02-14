"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireWorkerOwns = requireWorkerOwns;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
        return res.status(401).json({ message: "Unauthorized" });
    const token = auth.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: payload.sub, role: payload.role, email: payload.email };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role !== role)
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
}
function requireWorkerOwns(paramWorkerIdField = "workerId") {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role === "admin")
            return next();
        const workerId = req.params[paramWorkerIdField] || (req.body && req.body.workerId);
        if (!workerId)
            return res.status(400).json({ message: "Missing workerId" });
        if (workerId !== req.user.id)
            return res.status(403).json({ message: "Forbidden - can only operate on own resources" });
        next();
    };
}
exports.default = {};
