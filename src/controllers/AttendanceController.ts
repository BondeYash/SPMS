import { Request, Response } from "express";
import { AttendanceService } from "../services/AttendanceService";

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

export class AttendanceController {
  private service = new AttendanceService();

  timeIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const record = await this.service.timeIn(userId);
      res
        .status(201)
        .json(successResponse("Attendance submitted successfully.", record));
    } catch (err: any) {
      const status = err.statusCode || (err.code === "ATTENDANCE_DUPLICATE" ? 409 : 500);
      res.status(status).json(errorResponse(err.message));
    }
  };

  myStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const record = await this.service.getMyStatus(userId);
      if (!record) {
        res.json(
          successResponse("No attendance record for today.", {
            hasRecord: false,
            record: null,
          })
        );
        return;
      }
      res.json(
        successResponse("Attendance status fetched.", {
          hasRecord: true,
          record,
        })
      );
    } catch (err: any) {
      res
        .status(500)
        .json(errorResponse("Error fetching attendance status.", err));
    }
  };

  /**
   * Worker: get calendar-style attendance data for a given month.
   * Query param: month=YYYY-MM (defaults to current month if omitted).
   */
  myCalendar = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }

      const monthStr = (req.query.month as string | undefined) || "";
      let year: number;
      let month: number;

      if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
        const [y, m] = monthStr.split("-").map(Number);
        year = y;
        month = m;
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }

      const records = await this.service.getWorkerCalendar(userId, year, month);
      res.json(
        successResponse("Attendance calendar fetched.", {
          year,
          month,
          records,
        })
      );
    } catch (err: any) {
      res
        .status(500)
        .json(errorResponse("Error fetching attendance calendar.", err));
    }
  };

  pending = async (req: Request, res: Response): Promise<void> => {
    try {
      const records = await this.service.getPendingForAdmins();
      const mapped = records.map((r) => ({
        id: r.id,
        date: r.date,
        status: r.status,
        timeIn: r.timeIn,
        worker: {
          id: r.workerId,
          name: r.worker?.name,
          email: r.worker?.email,
        },
      }));
      res.json(
        successResponse("Pending attendance records fetched.", mapped)
      );
    } catch (err: any) {
      res
        .status(500)
        .json(errorResponse("Error fetching pending attendance records.", err));
    }
  };

  /**
   * Admin: get attendance records approved within the last 24 hours.
   */
  recentApproved = async (req: Request, res: Response): Promise<void> => {
    try {
      const records = await this.service.getRecentlyApprovedForAdmins();
      const mapped = records.map((r) => ({
        id: r.id,
        date: r.date,
        status: r.status,
        timeIn: r.timeIn,
        timeApproved: r.timeApproved,
        worker: {
          id: r.workerId,
          name: r.worker?.name,
          email: r.worker?.email,
        },
      }));
      res.json(
        successResponse("Recently approved attendance records fetched.", mapped)
      );
    } catch (err: any) {
      res
        .status(500)
        .json(errorResponse("Error fetching recently approved attendance records.", err));
    }
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json(errorResponse("Invalid attendance id."));
        return;
      }
      const adminId = (req as any).user?.id;
      if (!adminId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const updated = await this.service.changeStatus(id, "approved", adminId);
      res.json(
        successResponse("Attendance approved successfully.", updated)
      );
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json(errorResponse(err.message));
    }
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json(errorResponse("Invalid attendance id."));
        return;
      }
      const adminId = (req as any).user?.id;
      if (!adminId) {
        res.status(401).json(errorResponse("Unauthorized"));
        return;
      }
      const updated = await this.service.changeStatus(id, "rejected", adminId);
      res.json(
        successResponse("Attendance rejected successfully.", updated)
      );
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json(errorResponse(err.message));
    }
  };
}

