import { PickType } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateUsuarioDto } from './createUsuario.dto';

export class UpdatePassDto extends PickType(CreateUsuarioDto, ['senha'] as const) {
	@IsNotEmpty({ message: "A 'nova senha' deve ser informada." })
	@IsString({ message: "A 'nova senha' deve ser uma string." })
	novaSenha: string;

    @IsOptional()
	@IsString({ message: "O 'updateBy' deve ser uma string." })
	updatedBy: string;

	@IsOptional()
	@IsDate({ message: "O 'updatedAt' deve ser uma data." })
	updatedAt?: Date;
}
