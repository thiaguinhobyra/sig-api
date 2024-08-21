import { OmitType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateAuxiliarDto } from './create-auxiliar.dto';

export class UpdateAuxiliarDto extends OmitType(CreateAuxiliarDto, ["chave"] as const) {}
