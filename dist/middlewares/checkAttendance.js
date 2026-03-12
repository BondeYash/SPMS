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
exports.checkAttendance = checkAttendance;
const data_source_1 = require("../config/data-source");
const Attendance_1 = require("../entities/Attendance");
const date_1 = require("../utils/date");
const errorResponse = (message) => ({
    success: false,
    message,
    data: null,
});
function checkAttendance(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        if (!user) {
            res.status(401).json(errorResponse("Unauthorized"));
            return;
        }
        if (user.role === "admin") {
            next();
            return;
        }
        const workerId = user.id;
        const today = (0, date_1.getTodayLocalDateString)();
        try {
            const repo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
            const record = yield repo.findOne({
                where: { workerId, date: today },
            });
            if (!record) {
                res
                    .status(403)
                    .json(errorResponse("Attendance has not been submitted for today. Please time in first."));
                return;
            }
            if (record.status === "pending") {
                res
                    .status(403)
                    .json(errorResponse("Attendance is awaiting admin approval. Access is temporarily blocked."));
                return;
            }
            if (record.status === "rejected") {
                res
                    .status(403)
                    .json(errorResponse("You have been marked absent for today. Access is denied."));
                return;
            }
            next();
        }
        catch (err) {
            res
                .status(500)
                .json(errorResponse("Error checking attendance status. Please try again later."));
        }
    });
}
