import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { DashboardService } from '../services/dashboard.service';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import DashboardPermission from '../enum/dashboardPermission.enum';
import PermissionGuard from 'src/auth/guards/permission.guard';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Dashboard } from '../entities/dashboard.entity';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindOneParams } from 'src/utils/findOne.params';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { IdDto } from 'src/utils/id.dto';
import { GetDashboardDto } from '../dto/get-dashboard.dto';

@ApiBearerAuth('access_token')
@ApiTags('Dashboard')
@ApiResponse({ type: ResponseGeneric<Dashboard> })
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService
  ) { }

  @Post()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.MODIFICAR_DASHBOARD))
  async create(@Body() body: CreateDashboardDto): Promise<ResponseGeneric<Dashboard>> {
    // Chama método de cadastro de novo dashboard
    return await this.dashboardService.create(body);
  }

  @Get(':page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD))
  async findAll(
    @Body('userToken') userToken: IdDto,
    @Param('page') page: number,
    @Param('size') size: number,
    @Query('idPublic') idPublic: string = ''
    ): Promise<ResponseGeneric<PaginationInterface<GetDashboardDto[]>>> {
      // Chama método de listagem de todos os dashboards de acordo com os parametros
    return await this.dashboardService.findAllDashboardHome(idPublic, page, size, userToken);
  }

  // TODO: implementar perfil/:paramenter para todos os perfis, admin, gestor e usuario no service
  @Get('admin/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD))
  async findAllDashboardMenu(
    @Body('userToken') userToken: IdDto,
    ): Promise<ResponseGeneric<GetDashboardDto[]>> {
      // Chama método de listagem de todos os dashboards de acordo com os parametros
    return await this.dashboardService.findAllDashboardMenu(userToken);
  }

  @Get('home/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD_USUARIO))
  async findAllDashboardHome(
    @Body('userToken') userToken: IdDto,
    @Param('page') page: number,
    @Param('size') size: number,
    @Query('idPublic') idPublic: string = ''
    ): Promise<ResponseGeneric<PaginationInterface<GetDashboardDto[]>>> {
      // Chama método de listagem de todos os dashboards de acordo com os parametros
    return await this.dashboardService.findAllDashboardHome(idPublic, page, size, userToken);
  }

  @Get('setor/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD))
  async findAllBySetorAndPeriodo(
    @Body('userToken') userToken: IdDto,
    @Param('page') page: number,
    @Param('size') size: number,
    @Param('parameter') parameter: string = '',
    @Query('idPublic') idPublic: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date): Promise<ResponseGeneric<PaginationInterface<Dashboard[]>>> {
    // Chama método de listagem de todos os dashboards de acordo com os parametros
    return await this.dashboardService.findAllBySetorAndPeriodo(userToken, idPublicSetor, dataInicio, dataFim, parameter, idPublic, page, size);
  }

  @Get('orgao/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD))
  async findAllByOrgaoAndPeriodo(
    @Body('userToken') userToken: IdDto,
    @Query('idPublicOrgao') idPublicOrgao: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date,
    @Param('page') page: number,
    @Param('size') size: number,
    @Param('parameter') parameter: string = '') {
    // Chama método de listagem de todos os dashboards de acordo com os parametros
    return await this.dashboardService.findAllByOrgaoAndPeriodo(userToken, idPublicOrgao, idPublicSetor, dataInicio, dataFim, parameter, page, size);
  }

  @Get(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.LER_DASHBOARD))
  async findOne(@Param() { idPublic }: FindOneParams): Promise<ResponseGeneric<Dashboard>> {
    // Chama método busca dashboard por idPublic
    return await this.dashboardService.findOne(idPublic);
  }

  @Patch(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.MODIFICAR_DASHBOARD))
  async update(@Param() { idPublic }: FindOneParams, @Body() body: UpdateDashboardDto): Promise<ResponseGeneric<Dashboard>> {
    // Chama método método que atualiza dados do dashboard com o idPublic
    return await this.dashboardService.update(idPublic, body);
  }

  @Delete(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(DashboardPermission.MODIFICAR_DASHBOARD))
  remove(@Param() { idPublic }: FindOneParams, @Body('userToken') userToken: any): Promise<ResponseGeneric<Dashboard>> {
    // Chama método que deleta dashboard por idPublic
    return this.dashboardService.remove(idPublic, userToken);
  }
}
