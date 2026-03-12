import { Request, Response } from "express";
import { NotificationService } from "../services/NotificationService";

const successResponse = (message: string, data: any = null) => ({
  success: true,
  message,
  data,
});

const errorResponse = (message: string, data: any = null) => ({
  success: false,
  message,
  data,
});

export class NotificationController {
  private service = new NotificationService();

  getUnread = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const notifications = await this.service.getUnreadForUser(userId);
      res.json(
        successResponse("Unread notifications fetched.", notifications)
      );
    } catch (err: any) {
      res
        .status(500)
        .json(errorResponse("Error fetching notifications.", err));
    }
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const { id } = req.params;
      const updated = await this.service.markAsRead(id as string, userId as string);
      res.json(successResponse("Notification marked as read.", updated));
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json(errorResponse(err.message));
    }
  };
}

