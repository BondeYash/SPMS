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
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const AuthService_1 = require("../services/AuthService");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const authService = new AuthService_1.AuthService();
// Login (workers and admins)
router.post("/login", (0, express_validator_1.body)("email").isEmail(), (0, express_validator_1.body)("password").isLength({ min: 6 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const { email, password } = req.body;
        const result = yield authService.authenticate(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ message: err.message });
    }
}));
// Register worker - admin only
router.post("/register", auth_1.requireAuth, (0, auth_1.requireRole)("admin"), (0, express_validator_1.body)("name").notEmpty(), (0, express_validator_1.body)("email").isEmail(), (0, express_validator_1.body)("password").isLength({ min: 6 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    try {
        const { name, email, password, contact, role } = req.body;
        const created = yield authService.registerWorker({ name, email, password, contact, role });
        res.status(201).json(created);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}));
exports.default = router;
