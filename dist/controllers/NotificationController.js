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
exports.NotificationController = void 0;
const NotificationService_1 = require("../services/NotificationService");
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
class NotificationController {
    constructor() {
        this.service = new NotificationService_1.NotificationService();
        this.getUnread = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const notifications = yield this.service.getUnreadForUser(userId);
                res.json(successResponse("Unread notifications fetched.", notifications));
            }
            catch (err) {
                res
                    .status(500)
                    .json(errorResponse("Error fetching notifications.", err));
            }
        });
        this.markRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    res.status(401).json(errorResponse("Unauthorized"));
                    return;
                }
                const { id } = req.params;
                const updated = yield this.service.markAsRead(id, userId);
                res.json(successResponse("Notification marked as read.", updated));
            }
            catch (err) {
                const status = err.statusCode || 500;
                res.status(status).json(errorResponse(err.message));
            }
        });
    }
}
exports.NotificationController = NotificationController;
