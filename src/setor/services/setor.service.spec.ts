import { Test, TestingModule } from '@nestjs/testing';
import { SetorService } from './setor.service';

describe('SetorService', () => {
  let service: SetorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetorService],
    }).compile();

    service = module.get<SetorService>(SetorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
