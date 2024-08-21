import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class FindOneParams {
    @ApiProperty({ type: String })
    @IsNotEmpty({ message: "O 'identificador' deve ser informado." })
    @IsUUID("4", { message: 'Não foi possível encontrar o item.' })
    idPublic: string;
}