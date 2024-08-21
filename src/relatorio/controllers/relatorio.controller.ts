import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import PermissionGuard from 'src/auth/guards/permission.guard';
import { FindOneParams } from 'src/utils/findOne.params';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { ResponseGeneric } from 'src/utils/response.generic';
import { TasksImportService } from '../../tasks/service/tasks.service';
import { CreateRelatorioDto } from '../dto/create-relatorio.dto';
import { UpdateRelatorioDto } from '../dto/update-relatorio.dto';
import { Relatorio } from '../entities/relatorio.entity';
import RelatorioPermission from '../enum/relatorioPermission.enum';
import { RelatorioService } from '../services/relatorio.service';
import { IdDto } from 'src/utils/id.dto';
import { GetRelatorioDto } from '../dto/get-relatorio.dto';

@ApiBearerAuth('access_token')
@ApiTags('Relatorio')
@ApiResponse({ type: ResponseGeneric<Relatorio> })
@Controller('relatorio')
export class RelatorioController {
  constructor(
    private readonly relatorioService: RelatorioService,
  ) { }
  private readonly tasksImportService: TasksImportService

  @Post()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.MODIFICAR_RELATORIO))
  async create(@Body() body: CreateRelatorioDto): Promise<ResponseGeneric<Relatorio>> {
    // Chama método de cadastro de novo relatorio
    return await this.relatorioService.create(body);
  }

  @Get(':page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async findAll(@Param('page') page: number, @Param('size') size: number, @Param('parameter') parameter: string = ''): Promise<ResponseGeneric<PaginationInterface<Relatorio[]>>> {
    // Chama método de listagem de todos os relatorios
    return await this.relatorioService.findAll(parameter, page, size);
  }

  // @Get('import/relatorios/:parameter?')
  @Get('import/relatorios')
  async importRelatorios(
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date
  ): Promise<ResponseGeneric<Relatorio[]>> {
    return (
      await this.relatorioService.findImportsFromRedmine(dataInicio, dataFim),
      await this.relatorioService.findImportsFromOtrs(dataInicio, dataFim)
    );

  }

  @Get('totais/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async totaisRelatorio(
    @Body('userToken') userToken: IdDto,
    @Query('idPublicOrgao') idPublicOrgao: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Query('idPublicRegistro') idPublicRegistro: string = '',
    @Query('idPublicEmpresa') idPublicEmpresa: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date,
    @Param('parameter') parameter: string = ''
    
    ): Promise<ResponseGeneric<GetRelatorioDto>> {
      
    // Chama método report relatorio por idPublic
    return await this.relatorioService.totaisRelatorio(userToken, idPublicOrgao, idPublicSetor, idPublicRegistro, idPublicEmpresa, dataInicio, dataFim, parameter);
  }

  @Get('setor/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async findAllBySetorAndPeriodo(
    @Body('userToken') userToken: IdDto,
    @Query('idPublicOrgao') idPublicOrgao: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Query('idPublicRegistro') idPublicRegistro: string = '',
    @Query('idPublicEmpresa') idPublicEmpresa: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date,
    @Param('page') page: number,
    @Param('size') size: number,
    @Param('parameter') parameter: string = ''): Promise<ResponseGeneric<PaginationInterface<Relatorio[]>>> {
    // Chama método de listagem de todos os relatórios de acordo com os parametros
    return await this.relatorioService.findAllBySetorAndPeriodo(userToken, idPublicOrgao, idPublicSetor, idPublicRegistro, idPublicEmpresa, dataInicio, dataFim, parameter, page, size);
  }

  @Get('orgao/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async findAllByOrgaoAndPeriodo(
    @Body('userToken') userToken: IdDto,
    @Query('idPublic') idPublic: string = '',
    @Query('idPublicRegistro') idPublicRegistro: string = '',
    @Query('idPublicEmpresa') idPublicEmpresa: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date, 
    @Param('page') page: number, 
    @Param('size') size: number, 
    @Param('parameter') parameter: string = '') {
    // Chama método de listagem de todos os relatórios de acordo com os parametros
    return await this.relatorioService.findAllByOrgaoAndPeriodo(userToken, idPublic, idPublicRegistro, idPublicEmpresa, dataInicio, dataFim, parameter, page, size);
  }

  /**
   * TODO: busar por usuario - findOneuUsuario - paginar
   * @param userToken 
   * @param idPublicOrgao 
   * @param idPublic 
   * @param idPublicSetor 
   * @param dataInicio 
   * @param dataFim 
   * @returns 
   */

  @Get('report/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async findAllForReport(
    @Body('userToken') userToken: IdDto,
    @Param('parameter') parameter: string = '',
    @Query('idPublicRegistro') idPublicRegistro: string = '',
    @Query('idPublicEmpresa') idPublicEmpresa: string = '',
    @Query('idPublicOrgao') idPublicOrgao: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date,
    ): Promise<ResponseGeneric<GetRelatorioDto>> {
      
    // Chama método report relatorio por idPublic
    return await this.relatorioService.findAllForReport(userToken, parameter, idPublicRegistro, idPublicEmpresa, idPublicOrgao, idPublicSetor, dataInicio, dataFim);
  }

  @Get(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.LER_RELATORIO))
  async findOne(@Param() { idPublic }: FindOneParams): Promise<ResponseGeneric<Relatorio>> {
    // Chama método busca relatorio por idPublic
    return await this.relatorioService.findOne(idPublic);
  }


  @Patch(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.MODIFICAR_RELATORIO))
  async update(@Param() { idPublic }: FindOneParams, @Body() body: UpdateRelatorioDto): Promise<ResponseGeneric<Relatorio>> {
    // Chama método método que atualiza dados do relatorio com o idPublic
    return await this.relatorioService.update(idPublic, body);
  }

  @Delete(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(RelatorioPermission.MODIFICAR_RELATORIO))
  remove(@Param() { idPublic }: FindOneParams, @Body('userToken') userToken: any): Promise<ResponseGeneric<Relatorio>> {
    // Chama método que deleta relatorio por idPublic
    return this.relatorioService.remove(idPublic, userToken);
  }
}
