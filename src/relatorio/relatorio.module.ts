import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatorioController } from './controllers/relatorio.controller';
import { Relatorio } from './entities/relatorio.entity';
import { RelatorioService } from './services/relatorio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Relatorio], 'default'),
    TypeOrmModule.forFeature([Relatorio], 'second'),
    TypeOrmModule.forFeature([Relatorio], 'third'),
  ],
  controllers: [RelatorioController],
  providers: [RelatorioService],
  exports: [RelatorioService]
})
export class RelatorioModule { }
