import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService } from '../service/auth.service';
import { Usuario } from 'src/usuarios/entities/usuario.entity';


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
			usernameField: 'email',
			passwordField: 'senha'
    });
  }

	async validate(email: string, senha: string): Promise<Usuario> {
    const usuario: Usuario = await this.authService.validateUser(email, senha);
      
    return usuario;
  }
}