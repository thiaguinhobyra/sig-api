import { Test, TestingModule } from '@nestjs/testing';
import { SetorController } from './setor.controller';
import { SetorService } from '../services/setor.service';

describe('SetorController', () => {
  let controller: SetorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetorController],
      providers: [SetorService],
    }).compile();

    controller = module.get<SetorController>(SetorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
