import { IsCPF } from "brazilian-class-validator";
import { Type } from "class-transformer";
import { IsNotEmpty, MinLength, IsEmail, IsString, IsOptional, IsBoolean, ValidateNested, ArrayMinSize, IsNumber } from "class-validator";
import { Setor } from "src/setor/entities/setor.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { IdDto } from "src/utils/id.dto";
import { Auxiliar } from "src/auxiliar/entities/auxiliar.entity";

export class CreateUsuarioDto {
    @IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @MinLength(4, { message: "O 'nome' deve conter no mínimo 4 caracteres." })
    nome: string;

    @IsNotEmpty({ message: "O 'e-mail' deve ser informado." })
    @IsEmail({}, { message: "O 'e-mail' deve ser válido." })
    email: string;

    @IsOptional()
    @IsCPF({ message: "O 'CPF' deve ser válido." })
    cpf: string;

    @IsNotEmpty({ message: "A 'senha' deve ser informada." })
    @IsString({ message: "A 'senha' deve ser uma string." })
    senha: string;
    
    @IsNotEmpty({ message: "O 'id da empresa' deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " A 'empresa' deve ser informado." })
    empresa: Auxiliar;

    @IsNotEmpty({ message: "A 'jornada' deve ser um número." })
    @IsNumber({}, { message: "A 'jornada' deve ser um número." })
    jornada: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'valor do salario' deve ser um número." })
    salario: number;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

    @IsOptional()
    @IsBoolean({ message: "O 'redefinir pass' deve ser verdadeiro ou falso." })
    redefinirPass?: boolean;

    @IsNotEmpty({ message: "O setor deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'setor' deve ser informado." })
    setor: Setor;

    @IsNotEmpty({ message: "O perfil deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'perfil' deve ser informado.", each: true })
    perfil: Perfil;

    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;

    @IsOptional()
    updatedBy?: string;
}