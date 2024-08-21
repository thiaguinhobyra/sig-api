import { Module } from '@nestjs/common';
import { OrgaoService } from './service/orgao.service';
import { OrgaoController } from './controller/orgao.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orgao } from './entities/orgao.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orgao])
  ],
  controllers: [OrgaoController],
  providers: [OrgaoService],
})
export class OrgaoModule {}
