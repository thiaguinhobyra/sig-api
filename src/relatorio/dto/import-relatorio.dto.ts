import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from "class-validator";

export class ImportRelatorioDto {
    @IsOptional()
    @IsString({ message: "O 'projeto' deve ser uma string;." })
    projeto: string;

    @IsOptional()
    @IsString({ message: "O 'id da tarefa' deve ser uma string;." })
    id: string;
    
    @IsOptional()
    @IsString({ message: "A 'tarefa' deve ser uma string." })
    tarefa: string;
    
    @IsOptional()
    @IsString({ message: "O 'tipo da tarefa' deve ser uma string." })
    tipo_tarefa: string;
    
    @IsOptional()
    @IsString({ message: "O 'status' deve ser uma string." })
    status: string

    @IsOptional()
    @IsString({ message: "O 'tipo de registro' deve ser uma string." })
    tipo_registro: string;

    @IsOptional()
    @IsDate({ message: "A 'data inicial' deve ser uma data." })
    inicio: Date;

    @IsOptional()
    @IsDate({ message: "A 'data final' deve ser uma data." })
    fim: Date;

    @IsOptional()
    @IsDate({ message: "A 'data de fechamento' deve ser uma data." })
    fechamento: Date;
    
    @IsOptional()
    @IsString({ message: "A 'descrição' deve ser uma string." })
    descricao: string;
    
    @IsOptional()
    @IsString({ message: "As 'horas' devem ser uma string." })
    horas: string;
    
    @IsOptional()
    @IsNumber({}, { message: "A 'jornada' deve ser um número." })
    jornada: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'salário' deve ser um número." })
    salario: number;
    
    @IsOptional()
    @IsString({ message: "O 'setor' deve ser uma string." })
    setor: string;
    
    @IsOptional()
    @IsString({ message: "O 'responsável' deve ser uma string." })
    responsavel: string;
}
