import { IsString, IsNotEmpty, IsEmail, IsNumber, MinLength, IsOptional, IsIn } from "class-validator";

export class CreateWorkerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNumber()
    @IsOptional()
    contact?: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsIn(["admin", "worker"])
    role?: "admin" | "worker";
}
