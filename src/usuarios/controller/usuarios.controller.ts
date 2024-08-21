import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { FindOneParams } from 'src/utils/findOne.params';
import { IdDto } from 'src/utils/id.dto';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { ResponseGeneric } from 'src/utils/response.generic';
import PermissionGuard from '../../auth/guards/permission.guard';
import { CreateUsuarioDto } from '../dto/createUsuario.dto';
import { Usuario } from '../entities/usuario.entity';
import UsuarioPermission from '../enums/usuarioPermission.enum';
import { UsuarioService } from '../service/usuarios.service';
import { UpdatePassDto } from '../dto/update-pass.dto';
import { UpdatePassRedefinirDto } from '../dto/update-pass-redefinir.dto';
import { Payload } from 'src/utils/email/interface/payload.interface';
import { EmailService } from 'src/utils/email/service/email.service';
import { EmailVerifyDto } from 'src/utils/emailVerify.dto';
import { UpdateUsuarioDto } from '../dto/updateUsuario.dto';
import { UpdateUsuarioSelfDto } from '../dto/update-usuario-self.dto';

@ApiBearerAuth('access_token')
@ApiTags('Usuário')
@ApiResponse({ type: ResponseGeneric<Usuario> })
@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private emailService: EmailService
  ) { }

  @Post()
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO, false))
  async create(@Body() body: CreateUsuarioDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método de cadastro de novo usuário
    return await this.usuarioService.create(body);
  }

  @Get('admin/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.LER_USUARIO, false))
  async findAllAdmin(@Param('page') page: number, @Param('size') size: number, @Param('parameter') parameter: string = ''): Promise<ResponseGeneric<PaginationInterface<Usuario[]>>> {
    // Chama método de listagem de todos os usuários do Perfil 'ADMIN'
    return await this.usuarioService.findAllAdmin(parameter, page, size);
  }

  @Get('gestor/:page/:size/search/:parameter?')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.LER_USUARIO, false))
  async findAllGestor(
    @Body('userToken') userToken: IdDto,
    @Query('idPublicOrgao') idPublicOrgao: string = '',
    @Query('idPublicSetor') idPublicSetor: string = '',
    @Param('page') page: number,
    @Param('size') size: number,
    @Param('parameter') parameter: string = ''
    ): Promise<ResponseGeneric<PaginationInterface<Usuario[]>>> {
    // Chama método de listagem de todos os usuários do Perfil 'Gestor'
    return await this.usuarioService.findAllGestor(userToken, idPublicOrgao, idPublicSetor, parameter, page, size);
  }

  @Get('gestor/:idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.LER_USUARIO_GESTOR, true))
  findOneGestor(@Param() { idPublic }: FindOneParams): Promise<ResponseGeneric<Usuario>> {
    // Chama método que busca usuário por idPublic
    return this.usuarioService.findOneGestor(idPublic);
  }

  @Get('import/usuarios')
  async importRelatorios(
    @Query('dataInicio') dataInicio: Date,
    @Query('dataFim') dataFim: Date
  ): Promise<ResponseGeneric<Usuario[]>> {
    return (
      // Importa relatórios do dia anterior
      await this.usuarioService.findUsersFromOtrs(dataInicio, dataFim),
      await this.usuarioService.findUsersFromRedmine(dataInicio, dataFim)
    );
  }

  @Get(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(UsuarioPermission.LER_USUARIO, true))
  async findOne(@Param() { idPublic }: FindOneParams): Promise<ResponseGeneric<Usuario>> {
    // Chama método que busca usuário por idPublic
    return await this.usuarioService.findOne(idPublic);
  }

  @Patch(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO, false))
  async update(@Param() { idPublic }: FindOneParams, @Body() body: UpdateUsuarioDto, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que atualiza dados de usuário com o idPublic 
    return await this.usuarioService.update(idPublic, body, userToken);
  }

  @Patch('gestor/:idPublic')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO_GESTOR, false))
  async updateGestor(@Param() { idPublic }: FindOneParams, @Body() body: UpdateUsuarioDto, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que atualiza dados de usuário com o idPublic 
    return await this.usuarioService.updateGestor(idPublic, body, userToken);
  }

  @Patch(':idPublic/context')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO_PUBLIC, true))
  async updateSelf(@Param() { idPublic }: FindOneParams, @Body() body: UpdateUsuarioSelfDto, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que atualiza dados de usuário com o idPublic 
    return await this.usuarioService.updateSelf(idPublic, body, userToken);
  }

  @Patch('pass/:idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO_PUBLIC, true))
  async updatePass(@Param() { idPublic }: FindOneParams, @Body() body: UpdatePassDto, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<any>> {
    // Chama método que atualiza senha de usuário como idPublic
    return await this.usuarioService.updatePass(idPublic, body, userToken);
  }

  @Post('restore/pass')
  // @Recaptcha()
  async restorePass(@Body() body: EmailVerifyDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que gera e envia link para redefinição de senha
    return await this.usuarioService.restorePass(body);
  }

  @Patch('reset/pass/:token')
  async resetPass(@Param('token') token: string, @Body() body: UpdatePassRedefinirDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que decodifica token com a chave predefinida
    const payload: Payload = await this.emailService.decodeConfirmationToken(token);
    // Chama método que atualiza senha de usuário como idPublic
    return await this.usuarioService.resetPass(payload, body);
  }

  @Delete(':idPublic')
  // Verifica permissões de usuários
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO))
  remove(@Param() { idPublic }: FindOneParams, @Body('userToken') userToken: IdDto): Promise<ResponseGeneric<Usuario>> {
    // Chama método que deleta usuário por idPublic
    return this.usuarioService.remove(idPublic, userToken);
  }

  @Post('recuperar/:parameter')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO, false))
  async recover(@Param('parameter') parameter: string): Promise<ResponseGeneric<Usuario>> {
    // Chama método que recupera usuário por parametro enviado
    return await this.usuarioService.recuperar(parameter);
  }
}
