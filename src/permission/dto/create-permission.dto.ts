import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePermissionDto {
    @IsNotEmpty({ message: "A 'descrição' deve ser informada." })
    @IsString({ message: "A 'descricão' deve ser um texto." })
    @MinLength(10, { message: "A 'descrição' deve ser um texto explicativo." })
    descricao: string;

    @IsNotEmpty({ message: "A 'permissão' deve ser informada." })
    nome: string;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;

    @IsOptional()
    updatedBy?: string;
}
