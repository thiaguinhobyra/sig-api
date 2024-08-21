import { OmitType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Setor } from 'src/setor/entities/setor.entity';
import { IdDto } from 'src/utils/id.dto';
import { CreateUsuarioDto } from './createUsuario.dto';
import { Auxiliar } from 'src/auxiliar/entities/auxiliar.entity';

export class UpdateUsuarioDto extends OmitType(CreateUsuarioDto, ['senha', 'createdBy', 'email', 'perfil'] as const) {

    @IsOptional()
    @IsNumber({}, { message: "O 'id' deve ser um número." })
    id?: number;

    @IsOptional()
    @IsUUID(4, { message: "O 'idPublic' deve ser válido." })
    idPublic?: string;

    @IsOptional()
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'perfil' deve ser informado.", each: true })
    perfil?: Perfil;
    
    @IsOptional()
    @Type(() => IdDto)
    @ValidateNested({ message: " O id do 'setor' deve ser informado." })
    setor: Setor;

    @IsOptional()
    @Type(() => IdDto)
    @ValidateNested({ message: " A 'empresa' deve ser informado." })
    empresa: Auxiliar;
    
    @IsOptional()
    @IsDate({ message: "O 'updatedAt' deve ser uma data." })
    updatedAt?: Date;
    
    @IsOptional()
    @IsString({ message: "O 'updateBy' deve ser uma string." })
    updatedBy: string;
}
