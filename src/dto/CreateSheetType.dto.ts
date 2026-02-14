import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";

export class CreateSheetTypeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;
}
