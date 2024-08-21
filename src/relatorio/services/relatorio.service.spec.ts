import { Test, TestingModule } from '@nestjs/testing';
import { RelatorioService } from './relatorio.service';

describe('RelatorioService', () => {
  let service: RelatorioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelatorioService],
    }).compile();

    service = module.get<RelatorioService>(RelatorioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
