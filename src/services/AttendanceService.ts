import { AppDataSource } from "../config/data-source";
import { Attendance, AttendanceStatus } from "../entities/Attendance";
import { Worker } from "../entities/Worker";
import { Notification } from "../entities/Notification";
import { getTodayLocalDateString } from "../utils/date";
import { Between, MoreThan } from "typeorm";

export class AttendanceService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private workerRepo = AppDataSource.getRepository(Worker);
  private notificationRepo = AppDataSource.getRepository(Notification);

  private async getTodayRecord(workerId: string) {
    const today = getTodayLocalDateString();
    return this.attendanceRepo.findOne({
      where: { workerId, date: today },
      relations: ["worker", "approvedByUser"],
    });
  }

  async timeIn(workerId: string) {
    const worker = await this.workerRepo.findOneBy({ id: workerId });
    if (!worker) {
      const err: any = new Error("Worker not found");
      err.statusCode = 404;
      throw err;
    }

    const today = getTodayLocalDateString();
    const existing = await this.attendanceRepo.findOne({
      where: { workerId, date: today },
    });

    if (existing) {
      const msg =
        existing.status === "pending"
          ? "Attendance already submitted and pending approval for today."
          : `Attendance already ${existing.status} for today.`;
      const err: any = new Error(msg);
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

    const saved = await this.attendanceRepo.save(attendance);

    const admins = await this.workerRepo.find({ where: { role: "admin" } });
    if (admins.length) {
      const notifications = admins.map((admin) =>
        this.notificationRepo.create({
          userId: admin.id,
          user: admin,
          message: `New attendance request from ${worker.name}`,
          type: "attendance_request",
        })
      );
      await this.notificationRepo.save(notifications);
    }

    return saved;
  }

  async getMyStatus(workerId: string) {
    const record = await this.getTodayRecord(workerId);
    return record || null;
  }

  /**
   * Get all attendance records for a worker in a specific month.
   */
  async getWorkerCalendar(workerId: string, year: number, month: number) {
    const monthStr = month.toString().padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    // Compute last day of month by going to next month, day 0
    const lastDayDate = new Date(year, month, 0);
    const endDate = lastDayDate.toISOString().slice(0, 10);

    return this.attendanceRepo.find({
      where: {
        workerId,
        date: Between(startDate, endDate),
      },
      order: { date: "ASC" },
    });
  }

  async getPendingForAdmins() {
    return this.attendanceRepo.find({
      where: { status: "pending" },
      relations: ["worker"],
      order: { date: "DESC", timeIn: "DESC" },
    });
  }

  /**
   * Get attendance records approved within the last 24 hours.
   * Used by admins to see which workers are marked present recently.
   */
  async getRecentlyApprovedForAdmins() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.attendanceRepo.find({
      where: {
        status: "approved",
        timeApproved: MoreThan(since),
      },
      relations: ["worker"],
      order: { timeApproved: "DESC" },
    });
  }

  async changeStatus(
    id: number,
    status: AttendanceStatus,
    adminId: string
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({
      where: { id },
      relations: ["worker"],
    });
    if (!attendance) {
      const err: any = new Error("Attendance record not found");
      err.statusCode = 404;
      throw err;
    }

    attendance.status = status;
    attendance.timeApproved = new Date();
    attendance.approvedBy = adminId;

    const saved = await this.attendanceRepo.save(attendance);

    const message =
      status === "approved"
        ? "Your attendance has been approved."
        : "Your attendance has been rejected. You are marked absent for today.";
    const type: Notification["type"] =
      status === "approved" ? "attendance_approved" : "attendance_rejected";

    const notification = this.notificationRepo.create({
      userId: attendance.workerId,
      message,
      type,
    });
    await this.notificationRepo.save(notification);

    return saved;
  }
}

