import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseGeneric } from 'src/utils/response.generic';
import { DataSource, Repository } from 'typeorm';
import { CreateAuxiliarDto } from '../dto/create-auxiliar.dto';
import { UpdateAuxiliarDto } from '../dto/update-auxiliar.dto';
import { Auxiliar } from '../entities/auxiliar.entity';
import { keyAuxiliarEnum } from '../enum/keyAuxiliar.enum';

@Injectable()
export class AuxiliarService {
  constructor(
    @InjectRepository(Auxiliar)
    private auxiliarRepository: Repository<Auxiliar>,
    private dataSource: DataSource
  ) {}

  // Cadastro de novo dado auxiliar
  async create(body: CreateAuxiliarDto) {
    try {
      // Salva o valor com o o valor ou descrição informada
      var valor: string = body.valor || body.descricao;
    
      // Salva no corpo o valor convertido em UpperCase e sem espaços
      body.valor = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(" ", "_").toUpperCase();

      // Salva novo dado auxiliar no banco
      const auxiliar: Auxiliar = await this.auxiliarRepository.save(body)

      // Retorna dado auxiliar cadastrado
      return new ResponseGeneric<Auxiliar>(auxiliar);
    } catch (error) {
      // Verifica se o erro retornado é de dados duplicados na tabela
      if (error.code == 23505) {
        // Define mensagem de erro
        error = "Já existe um registro com o dado informado: '" + valor + "'";
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível cadastrar registro. ', code: error?.code, erro: error }, HttpStatus.BAD_REQUEST);
    }
  }

  // Listagem de todos os dados auxiliares filtrando ou não pela chave informada
  async findAll(chave?: keyAuxiliarEnum) {
    try {
      // Busca no banco todos os dados auxiliares cadastrados filtrando ou não pela chave informada
      const auxiliar: Auxiliar[] = await this.auxiliarRepository.findBy( !chave ? null : { chave } )

      // Retorna lista de dados auxiliares
      return new ResponseGeneric<Auxiliar[]>(auxiliar)
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar registros. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Busca de dado auxiliar por status
  async findAllByValor(valor: string) {
    try {
      // Busca no banco um dado auxiliar com o valor informado
      const auxiliar: Auxiliar[] = await this.auxiliarRepository.find({
        where: {
          valor: valor
        }
      })

      // Verifica se foi encontrado algum dado auxiliar
      if (!auxiliar) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado registro com este valor: ' + valor;
      }

      // Retorna dado auxiliar encontrado
      return new ResponseGeneric<Auxiliar[]>(auxiliar);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar registro. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Busca de dado auxiliar por idPublic
  async findOne(idPublic: string) {
    try {
      // Busca no banco um dado auxiliar com o idPublic informado
      const auxiliar: Auxiliar = await this.auxiliarRepository.findOneBy({ idPublic })

      // Verifica se foi encontrado algum dado auxiliar
      if (!auxiliar) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado registro com esta identificação: ' + idPublic;
      }

      // Retorna dado auxiliar encontrado
      return new ResponseGeneric<Auxiliar>(auxiliar);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar registro. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Busca de dado auxiliar por id
  async findOneById(id: number) {
    try {
      // Busca no banco um dado auxiliar com o id informado
      const auxiliar: Auxiliar = await this.auxiliarRepository.findOneBy({id})

      // Verifica se foi encontrado algum dado auxiliar
      if (!auxiliar) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado registro com este id: ' + id;
      }

      // Retorna dado auxiliar encontrado
      return new ResponseGeneric<Auxiliar>(auxiliar);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar registro. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Atualiza dados do dado auxiliar com o idPublic
  async update(idPublic: string, body: UpdateAuxiliarDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um dado auxiliar com o idPublic informado
      const auxiliarCheck: Auxiliar = await this.auxiliarRepository.findOneBy({ idPublic })

      // Verifica se foi encontrado algum dado auxiliar
      if (!auxiliarCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado registro com esta identificação: ' + idPublic;
      }

      // Salva o valor com o o valor ou descrição informada
      var valor: string = body.valor || body.descricao;
    
      // Salva no corpo o valor convertido em UpperCase e sem espaços
      body.valor = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(" ", "_").toUpperCase();

      // Atualiza no banco dados do dado auxiliar com o idPublic informado
      await queryRunner.manager.update(Auxiliar, { idPublic }, body)
      
      // Busca no banco um dado auxiliar com o idPublic informado
      const auxiliar = await this.auxiliarRepository.findOneBy({ idPublic })

      // Salva Transaction
      await queryRunner.commitTransaction();
      
      // Retorna dado auxiliar modificado
      return new ResponseGeneric<Auxiliar>(auxiliar)
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar registro. ', code: error?.code, erro: error }, HttpStatus.NOT_MODIFIED)
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  // Deleta dado auxiliar por idPublic
  async delete(idPublic: string) {
    try {
      // Busca no banco um dado auxiliar com o idPublic informado
      const auxiliar: Auxiliar = await this.auxiliarRepository.findOneBy({ idPublic })
      
      // Verifica se foi encontrado algum dado auxiliar
      if (!auxiliar) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado registro com esta identificação: ' + idPublic;
      }
      
      // Deleta o dado auxiliar com o idPublic informado
      await this.auxiliarRepository.delete({ idPublic });
      
      // Returna mensagem de sucesso
      return new ResponseGeneric<Auxiliar>(auxiliar)
    } catch (error) {
      // Verifica se o erro retornado é de existência de tabelas relacionadas
      if (error && error.code == '23503') {
        // Define mensagem de erro
        error = "Existem registros na tabela '" + error.table + "' que dependem desta informação."
      }
      
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar registro. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }
}
