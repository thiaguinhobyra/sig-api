import { IsNotEmpty, IsString } from "class-validator";

export class EmailToSigDto {
	
	@IsNotEmpty({ message: "O 'assunto' deve ser informado." })
	@IsString({ message: "O 'assunto' deve ser um texto." })
	assunto: string;

	@IsNotEmpty({ message: "O 'corpo' deve ser informado." })
	@IsString({ message: "O 'corpo' deve ser um texto." })
	corpo: string;

}
