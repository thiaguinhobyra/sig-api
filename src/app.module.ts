import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './config/database.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrgaoModule } from './orgao/orgao.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { SetorModule } from './setor/setor.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Relatorio } from './relatorio/entities/relatorio.entity';
import { TasksImportService } from './tasks/service/tasks.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Usuario } from './usuarios/entities/usuario.entity';
import { PerfilModule } from './perfil/perfil.module';
import { PermissionModule } from './permission/permission.module';
import { AuxiliarModule } from './auxiliar/auxiliar.module';

require('dotenv').config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: Number(process.env.THROTTLE_TTL),
      limit: Number(process.env.THROTTLE_LIMIT),
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DATABASE: Joi.string().required(),
        POSTGRES_HOST_REDMINE: Joi.string().required(),
        POSTGRES_PORT_REDMINE: Joi.number().required(),
        POSTGRES_USER_REDMINE: Joi.string().required(),
        POSTGRES_PASSWORD_REDMINE: Joi.string().required(),
        POSTGRES_DATABASE_REDMINE: Joi.string().required(),
        PORT: Joi.number(),
      })
    }),
    TypeOrmModule.forFeature([Relatorio], 'default'),
    TypeOrmModule.forFeature([Relatorio, Usuario], 'second'),
    TypeOrmModule.forFeature([Relatorio, Usuario], 'third'),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    PerfilModule,
    PermissionModule,
    SetorModule,
    DashboardModule,
    OrgaoModule,
    RelatorioModule,
    AuxiliarModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    TasksImportService
  ],
})
export class AppModule {
}
