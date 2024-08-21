import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCorpoDto {
	@IsNotEmpty({ message: "O 'link' deve ser informado." })
	@IsString({ message: "O 'link' deve ser um texto." })
	link: string;

	@IsNotEmpty({ message: "O 'nome' deve ser informado." })
	@IsString({ message: "O 'nome' deve ser um texto." })
	nome: string;

	@IsNotEmpty({ message: "O 'email' deve ser informado." })
	@IsString({ message: "O 'email' deve ser um texto." })
	email: string;

    @IsOptional()
	@IsString({ message: "O 'corpo' deve ser um texto." })
	mensagem?: string;

	@IsOptional()
	@IsString({ message: "O 'orgão' deve ser um texto." })
	orgao?: string;
}