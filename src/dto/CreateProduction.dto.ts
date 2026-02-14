import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID, IsNumber, Min, IsDateString } from "class-validator";
import { Type } from "class-transformer";

class ProductionItemDto {
    @IsUUID()
    @IsNotEmpty()
    sheetTypeId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateProductionDto {
    @IsUUID()
    @IsNotEmpty()
    workerId: string;

    @IsDateString() // YYYY-MM-DD
    @IsNotEmpty()
    date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductionItemDto)
    entries: ProductionItemDto[];
}
