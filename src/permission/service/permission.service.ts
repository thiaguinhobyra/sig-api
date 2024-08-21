import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {}

  // Listagem de todas as permissoes
  async findAll() {
    try {
      // Busca no banco todas as permissoes cadastradas
      const permissions: Permission[] = await this.permissionRepository.findBy({ ativo: true })

      // Retorna lista de permissoes
      return await new ResponseGeneric<Permission[]>(permissions);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Permissões. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)    
    }
  }

  // Busca de permissao por idPublic
  async findOne(idPublic: string) {
    try {
      // Busca no banco uma permissao com o idPublic informado
      const permission: Permission = await this.permissionRepository.findOneBy({ idPublic })

      // Verifica se foi encontrada alguma permissao
      if (!permission) {
        // Retorna mensagem de erro
        throw 'Não foi encontrada Funcionalidade com esta identificação: ' + idPublic;
      }

      // Retorna permissao encontrada
      return await new ResponseGeneric<Permission>(permission);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar Permissão. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }
}
