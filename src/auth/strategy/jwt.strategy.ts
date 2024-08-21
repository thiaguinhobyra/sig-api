import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { jwtConstants } from '../constants/constants';

import { DataSource } from 'typeorm';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private dataSource: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
      where: {
        email: payload.email
      },
      relations: {
        perfil: {
          permission: true
        },
        setor: {
          orgao: true
        }
      },
      loadEagerRelations: false
    })

    if (!usuario) {
      return false;
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Seu usuário foi inativado.');
    }

    if (usuario.redefinirPass) {
      throw new UnauthorizedException('É necessário redefinir a sua senha.');
    }
  
		const body = {
			firstAccess: usuario.firstAccess || new Date(new Date().setHours(new Date().getHours() - 3)),
			lastAccess: new Date(new Date().setHours(new Date().getHours() - 3)),
			updatedAt: usuario.updatedAt
		}

    await this.dataSource.getRepository(Usuario).update({ id: usuario.id }, body)

    return usuario;
  }
}