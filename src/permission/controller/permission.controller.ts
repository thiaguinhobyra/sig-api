import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FindOneParams } from 'src/utils/findOne.params';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Permission } from '../entities/permission.entity';
import { PermissionService } from '../service/permission.service';
import PermissionGuard from 'src/auth/guards/permission.guard';
import PermissionsPermission from '../enums/permissionsPermission.enum';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('access_token')
@ApiTags('Permission')
@ApiResponse({type: ResponseGeneric<Permission>})
@Controller('Permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PermissionsPermission.LER_PERMISSIONS))
  async findAll(): Promise<ResponseGeneric<Permission[]>> {
    // Chama método de listagem de todas as funcionalidades
    return await this.permissionService.findAll();
  }

  @Get(':idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(PermissionsPermission.LER_PERMISSIONS))
  async findOne(@Param() {idPublic}: FindOneParams): Promise<ResponseGeneric<Permission>> {
    // Chama método que busca funcionalidade por idPublic
    return await this.permissionService.findOne(idPublic);
  }
}
