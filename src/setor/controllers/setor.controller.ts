import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IdDto } from 'src/utils/id.dto';
import { ResponseGeneric } from 'src/utils/response.generic';
import { CreateSetorDto } from '../dto/create-setor.dto';
import { UpdateSetorDto } from '../dto/update-setor.dto';
import { Setor } from '../entities/setor.entity';
import { SetorService } from '../services/setor.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import PermissionGuard from 'src/auth/guards/permission.guard';
import SetorPermission from '../enum/setorPermission.enum';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { FindOneParams } from 'src/utils/findOne.params';

@ApiBearerAuth('access_token')
@ApiTags('Setor')
@ApiResponse({type: ResponseGeneric<Setor>})
@Controller('setor')
export class SetorController {
  constructor(private readonly setorService: SetorService) {}

  @Post()
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(SetorPermission.MODIFICAR_SETOR))
  async create(@Body() body: CreateSetorDto): Promise<ResponseGeneric<Setor>> {
    // Chama método de cadastro de novo setor
    return await this.setorService.create(body);
  }

  @Get()
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(SetorPermission.LER_SETOR))
  async findAll(): Promise<ResponseGeneric<Setor[]>> {
    // Chama método de listagem de todos os setores
    return await this.setorService.findAll();
  }
  @Get(':page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(SetorPermission.LER_SETOR))
  async findAllByParameter(
    @Param('page') page: number, 
    @Param('size') size: number, 
    @Param('parameter') parameter: string = '',
    @Query('idPublic') idPublic: string = ''
  ): Promise<ResponseGeneric<PaginationInterface<Setor[]>>> {

    return await this.setorService.findAllByParameter(parameter, idPublic, page, size);
  }

  @Get('search')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(SetorPermission.LER_SETOR))
  async findAllByUserSetor(
    @Body('userToken') userToken: IdDto
    ): Promise<ResponseGeneric<Setor[]>> {
    return await this.setorService.findAllByUserSetor(userToken);
  }

  @Get('orgao/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(SetorPermission.LER_SETOR))
  async findAllByOrgao(
    @Body('userToken') userToken: IdDto,
    @Query('idPublic') idPublic: string = ''
    ): Promise<ResponseGeneric<Setor[]>> {
    return await this.setorService.findAllByOrgao(userToken, idPublic);
  }

  @Get(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(SetorPermission.LER_SETOR))
  async findOne(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Setor>> {
    // Chama método que busca setor por idPublic
    return await this.setorService.findOne(idPublic);
  }

  @Patch(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(SetorPermission.MODIFICAR_SETOR))
  async update(@Param() {idPublic}: FindOneParams, @Body() body: UpdateSetorDto): Promise<ResponseGeneric<Setor>> {
    // Chama método que atualiza dados dos setores com o idPublic 
    return await this.setorService.update(idPublic, body);
  }

  @Delete(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(SetorPermission.MODIFICAR_SETOR))
  async remove(@Param() {idPublic}: FindOneParams, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<Setor>> {
    // Chama método que deleta setores por idPublic
    return await this.setorService.remove(idPublic);
  }
}
