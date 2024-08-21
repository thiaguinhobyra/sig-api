import { Type } from "class-transformer";
import { ArrayMinSize, IsBoolean, IsOptional, IsUUID, IsUrl, MinLength, ValidateNested } from "class-validator";
import { Orgao } from "src/orgao/entities/orgao.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { Setor } from "src/setor/entities/setor.entity";

export class GetDashboardDto {
    @IsOptional()
    @IsUUID(4, { message: "O 'idPublic' deve ser valido." })
    idPublic?: string;
    
    @IsOptional()
    nome: string

    @IsOptional()
    icone: string
    
    @IsOptional()
    @IsUrl({ message: "A 'url' deve ser válida." })
    url: string;

    @IsOptional()
    @IsBoolean({ message: "A 'home' deve ser verdadeiro ou falso." })
    home?: boolean;

    @IsOptional()
    @IsBoolean({ message: "A 'ativo' deve ser verdadeiro ou falso." })
    ativo?: boolean;

    @IsOptional()
    @Type(() => Orgao)
    @ValidateNested({ message: " O id do 'orgao' deve ser informado." })
    orgao: Orgao;

    @IsOptional()
    @Type(() => Setor)
    @ValidateNested({ message: " O id do 'setor' deve ser informado." })
    setor: Setor;
    
    @IsOptional()
    @ArrayMinSize(1, { message: "É necessário informar ao menos um perfil." })
    @Type(() => Perfil)
    @ValidateNested({ message: " O id do 'perfil' deve ser informado.", each: true })
    perfil: Perfil[];
}
