import { Module } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dashboard } from './entities/dashboard.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dashboard])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
