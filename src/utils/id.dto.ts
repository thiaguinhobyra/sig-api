import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class IdDto {
    @IsInt({ message: " O 'id' deve ser um número." })
    @Type(() => Number)
    @IsNotEmpty({ message: " O 'id' deve ser informado." })
    id: number;
}
