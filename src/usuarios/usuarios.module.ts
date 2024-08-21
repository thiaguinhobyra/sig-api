import { Module } from '@nestjs/common';
import { UsuarioService } from './service/usuarios.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuarioController } from './controller/usuarios.controller';
import { PassVerify } from 'src/utils/pass-verify/passVerify';
import { EmailModule } from 'src/utils/email/email.module';
import { Relatorio } from 'src/relatorio/entities/relatorio.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    TypeOrmModule.forFeature([Relatorio, Usuario], 'second'),
    TypeOrmModule.forFeature([Relatorio, Usuario], 'third'),
    JwtModule.register({}),
    EmailModule
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, PassVerify],
  exports: [UsuarioService, TypeOrmModule]
})
export class UsuariosModule {}
