"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEntry = void 0;
const typeorm_1 = require("typeorm");
const Worker_1 = require("./Worker");
const SheetType_1 = require("./SheetType");
let ProductionEntry = class ProductionEntry {
};
exports.ProductionEntry = ProductionEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProductionEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Worker_1.Worker, (worker) => worker.productionEntries, { nullable: false, onDelete: "CASCADE", createForeignKeyConstraints: false }),
    (0, typeorm_1.JoinColumn)({ name: "workerId" }),
    __metadata("design:type", Worker_1.Worker)
], ProductionEntry.prototype, "worker", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductionEntry.prototype, "workerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SheetType_1.SheetType, (sheetType) => sheetType.productionEntries, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "sheetTypeId" }),
    __metadata("design:type", SheetType_1.SheetType)
], ProductionEntry.prototype, "sheetType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductionEntry.prototype, "sheetTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)("int"),
    __metadata("design:type", Number)
], ProductionEntry.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)("date"),
    __metadata("design:type", String)
], ProductionEntry.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProductionEntry.prototype, "createdAt", void 0);
exports.ProductionEntry = ProductionEntry = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(["worker", "date"], { unique: true }) // Enforce one entry per worker per day
], ProductionEntry);
