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
exports.NotificationService = void 0;
const data_source_1 = require("../config/data-source");
const Notification_1 = require("../entities/Notification");
class NotificationService {
    constructor() {
        this.repo = data_source_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    getUnreadForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repo.find({
                where: { userId, isRead: false },
                order: { createdAt: "DESC" },
            });
        });
    }
    markAsRead(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repo.findOne({ where: { id, userId } });
            if (!notification) {
                const err = new Error("Notification not found");
                err.statusCode = 404;
                throw err;
            }
            notification.isRead = true;
            return this.repo.save(notification);
        });
    }
}
exports.NotificationService = NotificationService;
