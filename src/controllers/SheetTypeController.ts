import { Request, Response } from "express";
import { SheetTypeService } from "../services/SheetTypeService";
import { CreateSheetTypeDto } from "../dto/CreateSheetType.dto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

export class SheetTypeController {
    private sheetTypeService = new SheetTypeService();

    create = async (req: Request, res: Response): Promise<void> => {
        const dto = plainToInstance(CreateSheetTypeDto, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }

        try {
            const sheetType = await this.sheetTypeService.createSheetType(dto);
            res.status(201).json(sheetType);
        } catch (error) {
            res.status(500).json({ message: "Error creating sheet type", error });
        }
    };

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const sheetTypes = await this.sheetTypeService.getAllSheetTypes();
            res.json(sheetTypes);
        } catch (error) {
            res.status(500).json({ message: "Error fetching sheet types", error });
        }
    };
}
