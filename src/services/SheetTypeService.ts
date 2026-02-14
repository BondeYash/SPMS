import { AppDataSource } from "../config/data-source";
import { SheetType } from "../entities/SheetType";
import { CreateSheetTypeDto } from "../dto/CreateSheetType.dto";

export class SheetTypeService {
    private sheetTypeRepository = AppDataSource.getRepository(SheetType);

    async createSheetType(data: CreateSheetTypeDto): Promise<SheetType> {
        const sheetType = this.sheetTypeRepository.create(data);
        return this.sheetTypeRepository.save(sheetType);
    }

    async getAllSheetTypes(): Promise<SheetType[]> {
        return this.sheetTypeRepository.find();
    }
}
