import { Type } from "class-transformer";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";
import { Relatorio } from "../entities/relatorio.entity";
import { CreateRelatorioDto } from "./create-relatorio.dto";
import { PartialType } from "@nestjs/swagger";

export class GetRelatorioDto extends PartialType(CreateRelatorioDto)  {
    @IsOptional()
    @Type(() => Relatorio)
    @ValidateNested({ message: " O id da 'relatório' deve ser informado.", each: true })
    registros?: Relatorio[];

    @IsOptional()
    @IsNumber({}, { message: "O 'total de registros' deve ser um número." })
    totalRegistros?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'tota de horas' deve ser um número." })
    totalHoras?: string;

    @IsOptional()
    @IsNumber({}, { message: "O 'total valor' deve ser um número." })
    totalValor?: number;
}