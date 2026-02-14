import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { ProductionEntry } from "./ProductionEntry";

@Entity()
export class Worker {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: "bigint", nullable: true })
    contact: number;

    @Column()
    password : string;

    @Column ({default : "worker"})
    role : "admin" | "worker";

    @Column({ unique: true, nullable: true })
    shortId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => ProductionEntry, (entry) => entry.worker)
    productionEntries: ProductionEntry[];
}
