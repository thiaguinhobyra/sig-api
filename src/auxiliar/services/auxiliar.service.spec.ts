import { Test, TestingModule } from '@nestjs/testing';
import { AuxiliarService } from './auxiliar.service';

describe('AuxiliarService', () => {
  let service: AuxiliarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuxiliarService],
    }).compile();

    service = module.get<AuxiliarService>(AuxiliarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
