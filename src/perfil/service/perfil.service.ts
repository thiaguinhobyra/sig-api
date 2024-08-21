import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { Perfil } from '../entities/perfil.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ResponseGeneric } from 'src/utils/response.generic';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private perfilRepository: Repository<Perfil>,
    private dataSource: DataSource
  ) {}

  async create(body: CreatePerfilDto) {
    try {
      // Salva novo perfil no banco
      const perfil: Perfil = await this.perfilRepository.save(body);
      
      // Busca no banco perfil com o id informado
      const perfilReturn: Perfil = await this.perfilRepository.findOneBy({id: perfil.id});

      // Retorna perfil cadastrado
      return new ResponseGeneric<Perfil>(perfilReturn);
    } catch (error) {
      // Verifica se o erro retornado é de dados duplicados na tabela
      if (error.code == 23505) {
        // Define mensagem de erro
        error = 'Já existe um perfil igual a este cadastrado.'
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: "Não foi possível cadastrar Perfil. ", code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAll() {
    try {
      // Busca no banco todos os perfis cadastrados
      const perfis: Perfil[] = await this.perfilRepository.find();

      // Retorna lista de perfis
      return new ResponseGeneric<Perfil[]>(perfis);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os perfis. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);      
    }
  }

  // Busca de perfil por idPublic
  async findOne(idPublic: string) {
    try {
      // Busca no banco um perfil com o idPublic informado
      const perfil: Perfil = await this.perfilRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrado algum perfil
      if (!perfil) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Perfil com esta identificação: ' + idPublic;
      }

      // Retorna perfil encontrado
      return await new ResponseGeneric<Perfil>(perfil);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar Perfil. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  // Atualiza dados do perfil com o idPublic
  async update(idPublic: string, body: UpdatePerfilDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um perfil com o idPublic informado
      const perfilOriginal: Perfil = await this.perfilRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrado algum perfil
      if (!perfilOriginal) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Perfil com esta identificação: ' + idPublic;
      }

      // Salva no corpo id do perfil encontrado
      body.id = perfilOriginal.id;
      // Salva no corpo idPublic do perfil encontrado
      body.idPublic = perfilOriginal.idPublic;
      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3))

      // Atualiza no banco dados do perfil com o id igual ao contido no body
      await queryRunner.manager.save(Perfil, body);

      // Busca no banco um perfil com o idPublic informado
      const perfil: Perfil = await queryRunner.manager.findOneBy(Perfil, { idPublic: idPublic })
      
      // Salva Transaction
      await queryRunner.commitTransaction();
      
      // Retorna perfil modificado
      return new ResponseGeneric<Perfil>(perfil);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retornar mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar a Perfil. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  // Deleta perfil por idPublic
  async remove(idPublic: string) {
    try {
      // Busca no banco um perfil com o idPublic informado
      const perfil: Perfil = await this.perfilRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrado algum perfil
      if (!perfil) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Perfil com esta identificação: ' + idPublic;
      }

      // Remove as relações entre o perfil a ser deletado e as permissões que possui
      await this.dataSource.manager.query("delete from security.perfil_permission where perfil_id = $1", [perfil.id])

      // Deleta o perfil com o idPublic informado
      await this.perfilRepository.delete({ idPublic })
      
      // Returna mensagem de sucesso
      return new ResponseGeneric<Perfil>(null, 'Perfil deletado com sucesso.');
    } catch (error) {
      // Verifica se o erro retornado é de existência de tabelas relacionadas
      if (error && error.code == '23503') {
        // Define mensagem de erro
        error = "Existem registros na tabela '" + error.table + "' que dependem deste Perfil."
      }
      
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Perfil. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
}
