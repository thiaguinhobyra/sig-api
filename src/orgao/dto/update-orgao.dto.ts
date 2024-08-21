import { PartialType } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CreateOrgaoDto } from './create-orgao.dto';

export class UpdateOrgaoDto extends PartialType(CreateOrgaoDto) {
    @IsOptional()
    @IsNumber({}, { message: "O 'id' deve ser um número." })
    id?: number;

    @IsOptional()
    @IsUUID(4, { message: "O 'idPublic' deve ser válido." })
    idPublic?: string;

    @IsOptional()
    @IsDate({ message: "O 'updatedAt' deve ser uma data." })
    updatedAt?: Date;
}
