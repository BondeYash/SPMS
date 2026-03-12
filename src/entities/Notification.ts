import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
 CreateDateColumn,
} from "typeorm";
import { Worker } from "./Worker";

export type NotificationType =
  | "attendance_request"
  | "attendance_approved"
  | "attendance_rejected";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Worker, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: Worker;

  @Column()
  userId!: string;

  @Column()
  message!: string;

  @Column({ type: "varchar", length: 50 })
  type!: NotificationType;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

