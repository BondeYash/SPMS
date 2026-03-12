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
exports.AttendanceController = void 0;
const AttendanceService_1 = require("../services/AttendanceService");
const successResponse = (message, data = null) => ({
    success: true,
    message,
    data,
});
const errorResponse = (message, data = null) => ({
    success: false,
    message,
    data,
});
class AttendanceController {
    constructor() {
        this.service = new AttendanceService_1.AttendanceService();
        this.timeIn = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const record = yield this.service.timeIn(userId);
                res
                    .status(201)
                    .json(successResponse("Attendance submitted successfully.", record));
            }
            catch (err) {
                const status = err.statusCode || (err.code === "ATTENDANCE_DUPLICATE" ? 409 : 500);
                res.status(status).json(errorResponse(err.message));
            }
        });
        this.myStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const record = yield this.service.getMyStatus(userId);
                if (!record) {
                    res.json(successResponse("No attendance record for today.", {
                        hasRecord: false,
                        record: null,
                    }));
                    return;
                }
                res.json(successResponse("Attendance status fetched.", {
                    hasRecord: true,
                    record,
                }));
            }
            catch (err) {
                res
                    .status(500)
                    .json(errorResponse("Error fetching attendance status.", err));
            }
        });
        /**
         * Worker: get calendar-style attendance data for a given month.
         * Query param: month=YYYY-MM (defaults to current month if omitted).
         */
        this.myCalendar = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const monthStr = req.query.month || "";
                let year;
                let month;
                if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
                    const [y, m] = monthStr.split("-").map(Number);
                    year = y;
                    month = m;
                }
                else {
                    const now = new Date();
                    year = now.getFullYear();
                    month = now.getMonth() + 1;
                }
                const records = yield this.service.getWorkerCalendar(userId, year, month);
                res.json(successResponse("Attendance calendar fetched.", {
                    year,
                    month,
                    records,
                }));
            }
            catch (err) {
                res
                    .status(500)
                    .json(errorResponse("Error fetching attendance calendar.", err));
            }
        });
        this.pending = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const records = yield this.service.getPendingForAdmins();
                const mapped = records.map((r) => {
                    var _a, _b;
                    return ({
                        id: r.id,
                        date: r.date,
                        status: r.status,
                        timeIn: r.timeIn,
                        worker: {
                            id: r.workerId,
                            name: (_a = r.worker) === null || _a === void 0 ? void 0 : _a.name,
                            email: (_b = r.worker) === null || _b === void 0 ? void 0 : _b.email,
                        },
                    });
                });
                res.json(successResponse("Pending attendance records fetched.", mapped));
            }
            catch (err) {
                res
                    .status(500)
                    .json(errorResponse("Error fetching pending attendance records.", err));
            }
        });
        /**
         * Admin: get attendance records approved within the last 24 hours.
         */
        this.recentApproved = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const records = yield this.service.getRecentlyApprovedForAdmins();
                const mapped = records.map((r) => {
                    var _a, _b;
                    return ({
                        id: r.id,
                        date: r.date,
                        status: r.status,
                        timeIn: r.timeIn,
                        timeApproved: r.timeApproved,
                        worker: {
                            id: r.workerId,
                            name: (_a = r.worker) === null || _a === void 0 ? void 0 : _a.name,
                            email: (_b = r.worker) === null || _b === void 0 ? void 0 : _b.email,
                        },
                    });
                });
                res.json(successResponse("Recently approved attendance records fetched.", mapped));
            }
            catch (err) {
                res
                    .status(500)
                    .json(errorResponse("Error fetching recently approved attendance records.", err));
            }
        });
        this.approve = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    res.status(400).json(errorResponse("Invalid attendance id."));
                    return;
                }
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!adminId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const updated = yield this.service.changeStatus(id, "approved", adminId);
                res.json(successResponse("Attendance approved successfully.", updated));
            }
            catch (err) {
                const status = err.statusCode || 500;
                res.status(status).json(errorResponse(err.message));
            }
        });
        this.reject = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number(req.params.id);
                if (Number.isNaN(id)) {
                    res.status(400).json(errorResponse("Invalid attendance id."));
                    return;
                }
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!adminId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const updated = yield this.service.changeStatus(id, "rejected", adminId);
                res.json(successResponse("Attendance rejected successfully.", updated));
            }
            catch (err) {
                const status = err.statusCode || 500;
                res.status(status).json(errorResponse(err.message));
            }
        });
    }
}
exports.AttendanceController = AttendanceController;
