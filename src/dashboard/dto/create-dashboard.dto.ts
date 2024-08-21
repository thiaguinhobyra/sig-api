import { Type } from "class-transformer";
import { ArrayMinSize, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength, ValidateNested } from "class-validator"
import { Orgao } from "src/orgao/entities/orgao.entity";
import { Perfil } from "src/perfil/entities/perfil.entity"
import { Setor } from "src/setor/entities/setor.entity";
import { IdDto } from "src/utils/id.dto";

export class CreateDashboardDto {
    @IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @MinLength(4, { message: "O 'nome' deve conter no mínimo 4 caracteres." })
    nome: string

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

    @IsOptional()
    @IsBoolean({ message: "A 'home' deve conter valor verdadeiro ou falso." })
    home?: boolean;
    
    @IsNotEmpty({ message: "O 'url' deve ser informado." })
    @IsUrl({ message: "A 'url' deve ser válida." })
    url: string;

    @IsOptional()
    @IsString({ message: "O 'icone' deve ser uma string." })
    icone?: string;

    @IsOptional()
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'orgão' deve ser informado." })
    orgao: Orgao;

    @IsOptional()
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'setor' deve ser informado." })
    setor: Setor;
    
    @IsNotEmpty({ message: "O perfil deve ser informado." })
    @ArrayMinSize(1, { message: "É necessário informar ao menos um perfil." })
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'perfil' deve ser informado.", each: true })
    perfil: Perfil[];

    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;

    @IsOptional()
    @IsString({ message: "O 'updatedBy' deve ser uma string." })
    updatedBy?: string;
}
