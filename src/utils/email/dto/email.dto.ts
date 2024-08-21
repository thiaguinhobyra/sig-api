import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

import { AnexoEmailDto } from './anexo-email.dto';

export class EmailDto {
	@IsNotEmpty({ message: "O 'destinatario' deve ser informado." })
	@IsArray({ message: "O 'destinatario' deve ser um array." })
	@IsEmail({ each: true })
	destinatarios: string[];

	@IsOptional()
	@IsArray({ message: "O 'destinatario' deve ser um array." })
	@IsEmail({ each: true })
	cco?: string[];

	@IsNotEmpty({ message: "O 'assunto' deve ser informado." })
	@IsString({ message: "O 'assunto' deve ser um texto." })
	assunto: string;

	@IsNotEmpty({ message: "O 'corpo' deve ser informado." })
	@IsString({ message: "O 'corpo' deve ser um texto." })
	corpo: string;

	@IsOptional()
	@Type(() => AnexoEmailDto)
	@ValidateNested({ message: "Dados em 'envolvido' estão incorretos.", each: true })
	anexo?: AnexoEmailDto[];
}
