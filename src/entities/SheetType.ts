import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ProductionEntry } from "./ProductionEntry";

@Entity()
export class SheetType {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column("decimal", { precision: 10, scale: 2 })
    price: number;

    @OneToMany(() => ProductionEntry, (entry) => entry.sheetType)
    productionEntries: ProductionEntry[];
}
