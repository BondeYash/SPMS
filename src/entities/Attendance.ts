import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";
import { Worker } from "./Worker";

export type AttendanceStatus = "pending" | "approved" | "rejected";

@Entity()
@Unique(["workerId", "date"])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Worker, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "workerId" })
  worker!: Worker;

  @Column()
  workerId!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status!: AttendanceStatus;

  @Column({ type: "datetime", nullable: true })
  timeIn!: Date | null;

  @Column({ type: "datetime", nullable: true })
  timeApproved!: Date | null;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: "approvedBy" })
  approvedByUser?: Worker | null;

  @Column({ nullable: true })
  approvedBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

