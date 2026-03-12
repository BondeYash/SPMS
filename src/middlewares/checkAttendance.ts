import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Attendance } from "../entities/Attendance";
import { getTodayLocalDateString } from "../utils/date";

const errorResponse = (message: string) => ({
  success: false,
  message,
  data: null,
});

export async function checkAttendance(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json(errorResponse("Unauthorized"));
    return;
  }

  if (user.role === "admin") {
    next();
    return;
  }

  const workerId = user.id as string;
  const today = getTodayLocalDateString();

  try {
    const repo = AppDataSource.getRepository(Attendance);
    const record = await repo.findOne({
      where: { workerId, date: today },
    });

    if (!record) {
      res
        .status(403)
        .json(
          errorResponse(
            "Attendance has not been submitted for today. Please time in first."
          )
        );
      return;
    }

    if (record.status === "pending") {
      res
        .status(403)
        .json(
          errorResponse(
            "Attendance is awaiting admin approval. Access is temporarily blocked."
          )
        );
      return;
    }

    if (record.status === "rejected") {
      res
        .status(403)
        .json(
          errorResponse(
            "You have been marked absent for today. Access is denied."
          )
        );
      return;
    }

    next();
  } catch (err) {
    res
      .status(500)
      .json(
        errorResponse("Error checking attendance status. Please try again later.")
      );
  }
}

