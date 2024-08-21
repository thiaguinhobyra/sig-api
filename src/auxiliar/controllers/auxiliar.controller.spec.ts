import { Test, TestingModule } from '@nestjs/testing';
import { AuxiliarController } from './auxiliar.controller';
import { AuxiliarService } from '../services/auxiliar.service';

describe('AuxiliarController', () => {
  let controller: AuxiliarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuxiliarController],
      providers: [AuxiliarService],
    }).compile();

    controller = module.get<AuxiliarController>(AuxiliarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
