import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/constants';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '4h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
