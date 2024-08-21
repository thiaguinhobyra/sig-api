import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStatusUsuarioDto {
  @IsNotEmpty({ message: "O 'ativo' deve ser informado." })
  @IsBoolean({ message: "O 'ativo' deve conter valor verdadeiro ou falso." })
  ativo: boolean;

  @IsOptional()
  @IsString({ message: "O 'updateBy' deve ser uma string." })
  updatedBy: string;

  @IsOptional()
  @IsDate({ message: "O 'updatedAt' deve ser uma data." })
  updatedAt?: Date;
}