"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetTypeController = void 0;
const SheetTypeService_1 = require("../services/SheetTypeService");
const CreateSheetType_dto_1 = require("../dto/CreateSheetType.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SheetTypeController {
    constructor() {
        this.sheetTypeService = new SheetTypeService_1.SheetTypeService();
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = (0, class_transformer_1.plainToInstance)(CreateSheetType_dto_1.CreateSheetTypeDto, req.body);
            const errors = yield (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({ errors });
                return;
            }
            try {
                const sheetType = yield this.sheetTypeService.createSheetType(dto);
                res.status(201).json(sheetType);
            }
            catch (error) {
                res.status(500).json({ message: "Error creating sheet type", error });
            }
        });
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sheetTypes = yield this.sheetTypeService.getAllSheetTypes();
                res.json(sheetTypes);
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching sheet types", error });
            }
        });
    }
}
exports.SheetTypeController = SheetTypeController;
