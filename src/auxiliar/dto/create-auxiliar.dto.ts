import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { keyAuxiliarEnum } from "../enum/keyAuxiliar.enum";

export class CreateAuxiliarDto {
    
    @IsOptional()
    valor?: string;

    @IsNotEmpty({ message: "A 'descrição' deve ser informada." })
    descricao: string;

    @IsEnum(keyAuxiliarEnum, { message: "A 'chave' deve ser enumerada." })
    @IsNotEmpty({ message: "A 'chave' deve ser informada." })
    chave: keyAuxiliarEnum;
}
