import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Permission } from "src/permission/entities/permission.entity";

export class CreatePerfilDto {
    @IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @MinLength(2, { message: "O 'nome' deve conter no mínimo 2 caracteres." })
    nome: string;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

    @IsOptional()
    @IsArray({ message: "A 'permissão' deve ser um array." })
    permission?: Permission[];

    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;

    @IsOptional()
    updatedBy?: string;
}
