import { AppDataSource } from "../config/data-source";
import { Notification } from "../entities/Notification";

export class NotificationService {
  private repo = AppDataSource.getRepository(Notification);

  async getUnreadForUser(userId: string) {
    return this.repo.find({
      where: { userId, isRead: false },
      order: { createdAt: "DESC" },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repo.findOne({ where: { id, userId } });
    if (!notification) {
      const err: any = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    notification.isRead = true;
    return this.repo.save(notification);
  }
}

