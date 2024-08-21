import { IsBase64, IsNotEmpty, IsOptional } from "class-validator";

export class AnexoEmailDto {
    @IsOptional()
    nome?: string;

    @IsNotEmpty({ message: "O 'conteudo' deve ser informado." })
	@IsBase64({ message: "O 'conteudo' deve ser base64." })
	conteudo: string;
}