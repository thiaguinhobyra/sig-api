import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrgaoDto } from '../dto/create-orgao.dto';
import { UpdateOrgaoDto } from '../dto/update-orgao.dto';
import { Orgao } from '../entities/orgao.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseGeneric } from 'src/utils/response.generic';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { IdDto } from 'src/utils/id.dto';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { PerfilEnum } from 'src/perfil/enums/perfilEnum.enum';

@Injectable()
export class OrgaoService {
  constructor(
    @InjectRepository(Orgao)
    private orgaoRepository: Repository<Orgao>,
    private dataSource: DataSource
  ) { }

  async create(body: CreateOrgaoDto) {
    try {
      // Salva novo orgao no banco
      const orgao: Orgao = await this.orgaoRepository.save(body);

      // Busca no banco orgao com o id informado
      const orgaoReturn: Orgao = await this.orgaoRepository.findOneBy({ id: orgao.id });

      // Retorna orgao cadastrado
      return new ResponseGeneric<Orgao>(orgaoReturn);
    } catch (error) {
      // Verifica se o erro retornado é de dados duplicados na tabela
      if (error.code == 23505) {
        // Define mensagem de erro
        error = 'Já existe um orgao igual a esta cadastrada.'
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: "Não foi possível cadastrar Orgao. ", code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Listagem de todos os orgaos
  async findAll() {
    try {
      // Busca no banco todos os orgaos cadastrados
      const orgaos: Orgao[] = await this.orgaoRepository.find({
        loadEagerRelations: false,
        order: {
          nome: 'ASC'
        }
      });

      // Retorna a lista de orgaos
      return new ResponseGeneric<Orgao[]>(orgaos);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os Orgaos. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
  
  // Lista orgaos por perfil
  async findAllByUser(userToken: IdDto) {
    try {
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        relations: {
          perfil: true,
          setor: {
            orgao: true
          }
        },
        where: { id: userToken.id }
      });

      // Verifica se foi encontrado um usuário
      if (!usuario) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação. ';
      }
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      let whereUsed: any = {
        ativo: true
      };

      if (!isAdmin && isGestor) whereUsed = { idPublic: usuario.setor.orgao.idPublic }

      // whereUsed.ativo == true;

      // Busca no banco todos os orgaos cadastrados
      const orgaos: Orgao[] = await this.orgaoRepository.find({
        where: whereUsed,
        order: {
          nome: 'ASC'
        }
      });

      if(!orgaos) {
        throw 'Orgãos não foram encontrados. '
      }

      // Retorna lista de orgaos
      return new ResponseGeneric<Orgao[]>(orgaos);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar as orgãos. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Listagem de todos os orgaos
  async findAllByNomeOrSigla(parameter: string, page: number, size: number) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      // Busca no banco todos os orgaos cadastrados
      const [orgaos, total]: [Orgao[], number] = await this.orgaoRepository.findAndCount({
        loadEagerRelations: false,
        where: [
          {
            nome: ILike(parameter)
          },
          {
            sigla: ILike(parameter)
          }
        ],
        order: {
          nome: 'ASC'
        },
        take: size,
        skip: size * page
      });

      // Retorna a lista de orgaos
      return new ResponseGeneric<PaginationInterface<Orgao[]>>({
        content: orgaos,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os Orgaos. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Busca de orgao por idPublic
  async findOne(idPublic: string) {
    try {
      // Busca no banco um orgao com o idPublic informado
      const orgao: Orgao = await this.orgaoRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrad algum orgao
      if (!orgao) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Orgao com esta identificação: ' + idPublic;
      }

      // Retorna orgao encontrado
      return await new ResponseGeneric<Orgao>(orgao);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar Orgao. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async update(idPublic: string, body: UpdateOrgaoDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Busca no banco um orgao com o idPublic informado
      const orgaoCheck: Orgao = await this.orgaoRepository.findOne({
        loadEagerRelations: false,
        select: ['id', 'idPublic'],
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado um orgao
      if (!orgaoCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Orgão com esta identificação: ' + idPublic;
      }
      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3));

      // Salva no corpo id do orgao encontrado
      body.id = orgaoCheck.id;
      // Salva no corpo idPublic do orgao encontrado
      body.idPublic = orgaoCheck.idPublic;

      // Atualiza dados do orgao com o idPublic informado
      await queryRunner.manager.save(Orgao, body)

      // Busca no banco um orgao com o idPublic informado
      const orgao: Orgao = await queryRunner.manager.findOneBy(Orgao, { idPublic });

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna orgao modificado
      return new ResponseGeneric<Orgao>(orgao);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retornar mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Orgão. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async remove(idPublic: string) {
    try {
      // Busca no banco um orgao com o idPublic informado
      const orgao: Orgao = await this.orgaoRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrado algum orgao
      if (!orgao) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Orgão com esta identificação: ' + idPublic;
      }

      // Deleta a orgao com o idPublic informado
      await this.orgaoRepository.delete({ idPublic })

      // Returna mensagem de sucesso
      return new ResponseGeneric<Orgao>(null, 'Orgão deletado com sucesso.');
    } catch (error) {
      // Verifica se o erro retornado é de existência de tabelas relacionadas
      if (error && error.code == '23503') {
        // Define mensagem de erro
        error = "Existem registros na tabela '" + error.table + "' que dependem deste Orgão."
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Orgão. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
}
