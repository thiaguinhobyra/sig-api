import { Module } from '@nestjs/common';
import { AuxiliarService } from './services/auxiliar.service';
import { AuxiliarController } from './controllers/auxiliar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auxiliar } from './entities/auxiliar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auxiliar])
  ],
  controllers: [AuxiliarController],
  providers: [AuxiliarService],
})
export class AuxiliarModule {}
