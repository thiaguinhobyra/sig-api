import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrgaoService } from '../service/orgao.service';
import { CreateOrgaoDto } from '../dto/create-orgao.dto';
import { UpdateOrgaoDto } from '../dto/update-orgao.dto';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Orgao } from '../entities/orgao.entity';
import { FindOneParams } from 'src/utils/findOne.params';
import PermissionGuard from 'src/auth/guards/permission.guard';
import OrgaoPermission from '../enum/orgaoPermission.enum';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdDto } from 'src/utils/id.dto';

@ApiBearerAuth('access_token')
@ApiTags('Orgao')
@ApiResponse({type: ResponseGeneric<Orgao>})
@Controller('orgao')
export class OrgaoController {
  constructor(private readonly orgaoService: OrgaoService) {}

  @Post()
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.MODIFICAR_ORGAO))
  async create(@Body() body: CreateOrgaoDto): Promise<ResponseGeneric<Orgao>> {
    return await this.orgaoService.create(body);
  }

  @Get()
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.LER_ORGAO))
  async findAll(): Promise<ResponseGeneric<Orgao[]>> {   
    return await this.orgaoService.findAll();
  }

  @Get('search')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(OrgaoPermission.LER_ORGAO))
  async findAllByUser(
    @Body('userToken') userToken: IdDto
  ): Promise<ResponseGeneric<Orgao[]>> {
    return await this.orgaoService.findAllByUser(userToken);
  }

  @Get(':page/:size/search/:parameter?')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.LER_ORGAO))
  async findAllByNomeOrSigla(
    @Param('page') page: number, 
    @Param('size') size: number, 
    @Param('parameter') parameter: string = ''
    ): Promise<ResponseGeneric<PaginationInterface<Orgao[]>>> {
      
    return await this.orgaoService.findAllByNomeOrSigla(parameter, page, size);
  }

  @Get(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.LER_ORGAO))
  async findOne(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Orgao>> {
    return await this.orgaoService.findOne(idPublic);
  }

  @Patch(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.MODIFICAR_ORGAO))
  async update(@Param() {idPublic}: FindOneParams, @Body() body: UpdateOrgaoDto): Promise<ResponseGeneric<Orgao>> {
    return await this.orgaoService.update(idPublic, body);
  }

  @Delete(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(OrgaoPermission.MODIFICAR_ORGAO))
  async remove(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Orgao>> {
    return await this.orgaoService.remove(idPublic);
  }
}
