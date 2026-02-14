import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from "typeorm";
import { Worker } from "./Worker";
import { SheetType } from "./SheetType";

@Entity()
// Unique per worker + date + sheetType to allow multiple sheet-type lines in one daily submission
@Index(["workerId", "date", "sheetTypeId"], { unique: true })
export class ProductionEntry {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Worker, (worker) => worker.productionEntries, { nullable: false, onDelete: "CASCADE", createForeignKeyConstraints: false })
    @JoinColumn({ name: "workerId" })
    worker: Worker;

    @Column()
    workerId: string;

    @ManyToOne(() => SheetType, (sheetType) => sheetType.productionEntries, { nullable: false })
    @JoinColumn({ name: "sheetTypeId" })
    sheetType: SheetType;

    @Column()
    sheetTypeId: string;

    @Column("int")
    quantity: number;

    @Column("date")
    date: string; // YYYY-MM-DD

    @CreateDateColumn()
    createdAt: Date;
}
