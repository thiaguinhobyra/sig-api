import {
  Body, Controller, Post, UnauthorizedException, UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginUsuarioDto } from 'src/usuarios/dto/login-usuario.dto';
import { IdDto } from 'src/utils/id.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../service/auth.service';
import PermissionGuard from '../guards/permission.guard';
import UsuarioPermission from 'src/usuarios/enums/usuarioPermission.enum';

@ApiTags('Token')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: LoginUsuarioDto) {
    return await this.authService.login(body);
  }

  @ApiBearerAuth('access_token')
  // Verifica autenticidade do token informado e se o usuário tem permissão para realizar a ação
  @UseGuards(PermissionGuard(UsuarioPermission.MODIFICAR_USUARIO, true))
  @Post('user')
  async user(@Body('userToken') userToken: IdDto) {
    if (!userToken) {
      throw new UnauthorizedException('Login necessário.');
    }
    return await this.authService.loginToken(userToken);
  }
}