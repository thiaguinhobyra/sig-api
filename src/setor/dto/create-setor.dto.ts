import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { UpdateOrgaoDto } from "src/orgao/dto/update-orgao.dto";

export class CreateSetorDto {
    @IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @IsString({ message: "O 'nome' deve ser uma string." })
	nome: string;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

    @IsNotEmpty({ message: "O 'id do órgão' deve ser informado." })
    @Type(() => UpdateOrgaoDto)
    @ValidateNested({ message: " O 'órgão' deve ser informado." })
    orgao: UpdateOrgaoDto;

    @IsOptional()
    @IsString({ message: "O 'createBy' deve ser uma string." })
    createdBy?: string;
}
