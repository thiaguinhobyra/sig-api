import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateUsuarioDto } from './createUsuario.dto';


export class UpdateUsuarioSelfDto extends OmitType(CreateUsuarioDto, ['senha', 'createdBy', 'email', 'perfil'] as const) {
  @IsOptional()
  @IsString({ message: "O 'updateBy' deve ser uma string." })
  updatedBy: string;
}
