import { IsOptional } from "class-validator";

export class ImportUsuarioDto {
    @IsOptional()
    id: number;

    @IsOptional()
    nome: string;

    @IsOptional()
    sobrenome: string;

    @IsOptional()
    email: string;

    @IsOptional()
    cpf: string;

    @IsOptional()
    senha: string;

    @IsOptional()
    empresa: string;

    @IsOptional()
    jornada: number;

    @IsOptional()
    salario: number;

    @IsOptional()
    ativo?: boolean;

    @IsOptional()
    redefinirPass?: boolean;

    @IsOptional()
    setor: string;

    @IsOptional()
    perfil: number;

    @IsOptional()
    createdBy?: string;

    @IsOptional()
    updatedBy?: string;
}
