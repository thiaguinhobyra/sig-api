import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsUUID, MinLength } from "class-validator";

export class CreateOrgaoDto {

    @IsOptional()
    @IsNumber({}, { message: "O 'id' deve ser um número." })
    id?: number;

    @IsOptional()
    @IsUUID(4, { message: "O 'idPublic' deve ser válido." })
    idPublic?: string;

	@IsNotEmpty({ message: "O 'nome' deve ser informado." })
    @MinLength(4, { message: "O 'nome' deve conter no mínimo 4 caracteres" })
	nome: string;

	@IsNotEmpty({ message: "A 'sigla' deve ser informada." })
    @MinLength(2, { message: "A 'sigla' deve ser conter no mínimo 2 caracteres." })
	sigla: string;

    @IsOptional()
    @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
    ativo?: boolean;

}
