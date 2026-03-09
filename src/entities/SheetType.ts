import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ProductionEntry } from "./ProductionEntry";

@Entity()
export class SheetType {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    code: string;

    @Column("decimal", { precision: 10, scale: 2 })
    pricePerUnit: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => ProductionEntry, (entry) => entry.sheetType)
    productionEntries: ProductionEntry[];
}
