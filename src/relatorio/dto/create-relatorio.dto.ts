import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Auxiliar } from "src/auxiliar/entities/auxiliar.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { Setor } from "src/setor/entities/setor.entity";
import { Usuario } from "src/usuarios/entities/usuario.entity";
import { IdDto } from "src/utils/id.dto";

export class CreateRelatorioDto {
    @IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @IsString({ message: "O 'nome' deve ser uma string." })
    projeto: string;

    @IsOptional()
    @IsString({ message: "O 'id da tarefa' deve ser uma string." })
    idTarefa: string;
    
    @IsOptional()
    @IsString({ message: "A 'tarefa' deve ser uma string." })
    tarefa: string;
    
    @IsOptional()
    @IsString({ message: "O 'tipo da tarefa' deve ser uma string." })
    tipoTarefa: string;
    
    @IsNotEmpty({ message: "O 'id do status' deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O 'status' deve ser informado." })
    status: Auxiliar;

    @IsNotEmpty({ message: "O 'id do tipo de registro' deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O 'tipo de registro' deve ser informado." })
    tipo_registro: Auxiliar;

    @IsNotEmpty({ message: "A data inicial deve ser informada" })
    dataInicio: Date;

    @IsNotEmpty({ message: "A data final deve ser informada" })
    dataFim: Date;

    @IsNotEmpty({ message: "A data do fechamento deve ser informada" })
    dataFechamento: Date;
    
    @IsOptional()
    @IsString({ message: "A 'descrição' deve ser uma string." })
    descricao: string;
    
    @IsOptional()
    @IsString({ message: "As 'horas' devem ser uma string." })
    horas: string;
    
    @IsOptional()
    @IsNumber({}, { message: "O 'valor da hora' deve ser um número." })
    valorHora: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'valor da tarefa' deve ser um número." })
    valorTarefa: number;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;
    
    @IsNotEmpty({ message: "O setor deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'setor' deve ser informado." })
    setor: Setor;

    // @IsNotEmpty({ message: "O perfil deve ser informado." })
    // @Type(() => IdDto)
    // @ValidateNested({ message: " O id do 'perfil' deve ser informado." })
    // perfil: Perfil;
    
    @IsNotEmpty({ message: "O 'id do responsável' deve ser informado." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O 'responsável' deve ser informado." })
    responsavel: Usuario;
    
    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;
}
