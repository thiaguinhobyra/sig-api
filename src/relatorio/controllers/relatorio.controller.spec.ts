import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioController } from './relatorio.controller';
import { RelatorioService } from '../services/relatorio.service';

describe('RelatorioController', () => {
  let controller: RelatorioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatorioController],
      providers: [RelatorioService],
    }).compile();

    controller = module.get<RelatorioController>(RelatorioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
