import { Router } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/AuthService";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();
const authService = new AuthService();

// Login (workers and admins)
router.post(
    "/login",
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, password } = req.body;
            const result = await authService.authenticate(email, password);
            res.json(result);
        } catch (err: any) {
            res.status(401).json({ message: err.message });
        }
    }
);

// Register worker - admin only
router.post(
    "/register",
    requireAuth,
    requireRole("admin"),
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { name, email, password, contact, role } = req.body;
            const created = await authService.registerWorker({ name, email, password, contact, role });
            res.status(201).json(created);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }
);

export default router;
