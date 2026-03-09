import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";

export class CreateSheetTypeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsNumber()
    @Min(0)
    pricePerUnit: number;
}
