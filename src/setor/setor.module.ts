import { Module } from '@nestjs/common';
import { SetorService } from './services/setor.service';
import { SetorController } from './controllers/setor.controller';
import { Setor } from './entities/setor.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setor])
  ],
  controllers: [SetorController],
  providers: [SetorService],
})
export class SetorModule {}
