import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateAuxiliarDto } from '../dto/create-auxiliar.dto';
import { UpdateAuxiliarDto } from '../dto/update-auxiliar.dto';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Auxiliar } from '../entities/auxiliar.entity';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import PermissionGuard from 'src/auth/guards/permission.guard';
import { FindOneParams } from 'src/utils/findOne.params';
import { AuxiliarService } from '../services/auxiliar.service';
import AuxiliarPermission from '../enum/auxiliarPermission.enum';
import { keyAuxiliarEnum } from '../enum/keyAuxiliar.enum';

@ApiBearerAuth('access_token')
@ApiTags('auxiliar')
@ApiResponse({type: ResponseGeneric<Auxiliar>})
@Controller('auxiliar')
export class AuxiliarController {
  constructor(private readonly auxiliarService: AuxiliarService) {}

  @Post()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(AuxiliarPermission.MODIFICAR_AUXILIAR))
  async create(@Body() createAuxiliarDto: CreateAuxiliarDto): Promise<ResponseGeneric<Auxiliar>> {
    return await this.auxiliarService.create(createAuxiliarDto);
  }

  @Get()
  async findAll(): Promise<ResponseGeneric<Auxiliar[]>> {
    return await this.auxiliarService.findAll();
  }

  @Get('chave/:chave')
  async findAllByChave(@Param('chave') chave: keyAuxiliarEnum): Promise<ResponseGeneric<Auxiliar[]>> {
    // Chama método de listagem de todos os dados auxiliares com a chave informada
    return await this.auxiliarService.findAll(chave)
  }

  @Get(':idPublic')
  async findOne(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Auxiliar>> {
    return await this.auxiliarService.findOne(idPublic);
  }

  @Get('id/:id')
  async findOneById(@Param('id') id: string): Promise<ResponseGeneric<Auxiliar>> {
    return await this.auxiliarService.findOneById(+id);
  }

  @Get('valor/:valor')
  async findAllByValor(@Param('valor') valor: string): Promise<ResponseGeneric<Auxiliar[]>> {
    return await this.auxiliarService.findAllByValor(valor);
  }

  @Patch(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(AuxiliarPermission.MODIFICAR_AUXILIAR))
  async update(@Param() {idPublic}: FindOneParams, @Body() updateAuxiliarDto: UpdateAuxiliarDto): Promise<ResponseGeneric<Auxiliar>> {
    return await this.auxiliarService.update(idPublic, updateAuxiliarDto);
  }

  @Delete(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(AuxiliarPermission.MODIFICAR_AUXILIAR))
  async remove(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Auxiliar>> {
    return await this.auxiliarService.delete(idPublic);
  }
}
