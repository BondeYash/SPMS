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
exports.AttendanceService = void 0;
const data_source_1 = require("../config/data-source");
const Attendance_1 = require("../entities/Attendance");
const Worker_1 = require("../entities/Worker");
const Notification_1 = require("../entities/Notification");
const date_1 = require("../utils/date");
const typeorm_1 = require("typeorm");
class AttendanceService {
    constructor() {
        this.attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
        this.workerRepo = data_source_1.AppDataSource.getRepository(Worker_1.Worker);
        this.notificationRepo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    getTodayRecord(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const today = (0, date_1.getTodayLocalDateString)();
            return this.attendanceRepo.findOne({
                where: { workerId, date: today },
                relations: ["worker", "approvedByUser"],
            });
        });
    }
    timeIn(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const worker = yield this.workerRepo.findOneBy({ id: workerId });
            if (!worker) {
                const err = new Error("Worker not found");
                err.statusCode = 404;
                throw err;
            }
            const today = (0, date_1.getTodayLocalDateString)();
            const existing = yield this.attendanceRepo.findOne({
                where: { workerId, date: today },
            });
            if (existing) {
                const msg = existing.status === "pending"
                    ? "Attendance already submitted and pending approval for today."
                    : `Attendance already ${existing.status} for today.`;
                const err = new Error(msg);
                err.code = "ATTENDANCE_DUPLICATE";
                err.statusCode = 409;
                throw err;
            }
            const attendance = this.attendanceRepo.create({
                workerId,
                worker,
                date: today,
                status: "pending",
                timeIn: new Date(),
            });
            const saved = yield this.attendanceRepo.save(attendance);
            const admins = yield this.workerRepo.find({ where: { role: "admin" } });
            if (admins.length) {
                const notifications = admins.map((admin) => this.notificationRepo.create({
                    userId: admin.id,
                    user: admin,
                    message: `New attendance request from ${worker.name}`,
                    type: "attendance_request",
                }));
                yield this.notificationRepo.save(notifications);
            }
            return saved;
        });
    }
    getMyStatus(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.getTodayRecord(workerId);
            return record || null;
        });
    }
    /**
     * Get all attendance records for a worker in a specific month.
     */
    getWorkerCalendar(workerId, year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            const monthStr = month.toString().padStart(2, "0");
            const startDate = `${year}-${monthStr}-01`;
            // Compute last day of month by going to next month, day 0
            const lastDayDate = new Date(year, month, 0);
            const endDate = lastDayDate.toISOString().slice(0, 10);
            return this.attendanceRepo.find({
                where: {
                    workerId,
                    date: (0, typeorm_1.Between)(startDate, endDate),
                },
                order: { date: "ASC" },
            });
        });
    }
    getPendingForAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.attendanceRepo.find({
                where: { status: "pending" },
                relations: ["worker"],
                order: { date: "DESC", timeIn: "DESC" },
            });
        });
    }
    /**
     * Get attendance records approved within the last 24 hours.
     * Used by admins to see which workers are marked present recently.
     */
    getRecentlyApprovedForAdmins() {
        return __awaiter(this, void 0, void 0, function* () {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return this.attendanceRepo.find({
                where: {
                    status: "approved",
                    timeApproved: (0, typeorm_1.MoreThan)(since),
                },
                relations: ["worker"],
                order: { timeApproved: "DESC" },
            });
        });
    }
    changeStatus(id, status, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const attendance = yield this.attendanceRepo.findOne({
                where: { id },
                relations: ["worker"],
            });
            if (!attendance) {
                const err = new Error("Attendance record not found");
                err.statusCode = 404;
                throw err;
            }
            attendance.status = status;
            attendance.timeApproved = new Date();
            attendance.approvedBy = adminId;
            const saved = yield this.attendanceRepo.save(attendance);
            const message = status === "approved"
                ? "Your attendance has been approved."
                : "Your attendance has been rejected. You are marked absent for today.";
            const type = status === "approved" ? "attendance_approved" : "attendance_rejected";
            const notification = this.notificationRepo.create({
                userId: attendance.workerId,
                message,
                type,
            });
            yield this.notificationRepo.save(notification);
            return saved;
        });
    }
}
exports.AttendanceService = AttendanceService;
