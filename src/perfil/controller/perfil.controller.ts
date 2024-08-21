import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PerfilService } from '../service/perfil.service';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Perfil } from '../entities/perfil.entity';
import { FindOneParams } from 'src/utils/findOne.params';
import PermissionGuard from 'src/auth/guards/permission.guard';
import PerfilPermission from '../enums/perfilPermission.enum';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('access_token')
@ApiTags('Perfil')
@ApiResponse({type: ResponseGeneric<Perfil>})
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PerfilPermission.MODIFICAR_PERFIL))
  async create(@Body() body: CreatePerfilDto): Promise<ResponseGeneric<Perfil>> {
    // Chama método de cadastro de novo perfil
    return await this.perfilService.create(body);
  }
  
  @Get()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PerfilPermission.LER_PERFIL))
  async findAll(): Promise<ResponseGeneric<Perfil[]>> {
    // Chama método de listagem de todos os perfis
    return await this.perfilService.findAll();
  }

  @Get(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PerfilPermission.LER_PERFIL))
  async findOne(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Perfil>> {
    // Chama método que busca perfil por idPublic
    return await this.perfilService.findOne(idPublic);
  }

  @Patch(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PerfilPermission.MODIFICAR_PERFIL))
  async update(@Param() {idPublic}: FindOneParams, @Body() body: UpdatePerfilDto): Promise<ResponseGeneric<Perfil>> {
    // Chama método que atualiza dados de perfil com o idPublic
    return this.perfilService.update(idPublic, body);
  }
  
  @Delete(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PerfilPermission.MODIFICAR_PERFIL))
  remove(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Perfil>> {
    // Chama método que deleta perfil por idPublic
    return this.perfilService.remove(idPublic);
  }
}
