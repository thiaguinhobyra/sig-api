import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSetorDto } from '../dto/create-setor.dto';
import { UpdateSetorDto } from '../dto/update-setor.dto';
import { Orgao } from 'src/orgao/entities/orgao.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Setor } from '../entities/setor.entity';
import { ResponseGeneric } from 'src/utils/response.generic';
import { IdDto } from 'src/utils/id.dto';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { PerfilEnum } from 'src/perfil/enums/perfilEnum.enum';

@Injectable()
export class SetorService {
  constructor(
    @InjectRepository(Setor)
    private setorRepository: Repository<Setor>,
    private dataSource: DataSource
  ) {

  }

  async create(body: CreateSetorDto) {
    try {
      // Verifica se possui id de órgão
      if (body.orgao.id) {
        // Verifica se órgão existe no banco
        const orgao: Orgao = await this.dataSource.getRepository(Orgao).findOneBy({ id: body.orgao.id });
        if (!orgao) {
          // Retorna mensagem de erro
          throw 'Não existe este órgão do banco.';
        }
      }
      // Salva novo setor no banco
      const setor: Setor = await this.setorRepository.save(body);

      // Busca no banco setor com o id informado
      const setorReturn: Setor = await this.setorRepository.findOneBy({ id: setor.id });

      // Retorna setor cadastrado
      return new ResponseGeneric<Setor>(setorReturn);
    } catch (error) {
      // Verifica se o erro retornado é de dados duplicados na tabela
      if (error.code == 23505) {
        // Define mensagem de erro
        error = 'Já existe um setor igual a este cadastrado.'
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: "Não foi possível cadastrar Setor. ", code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAll() {
    try {
      // Busca no banco todos os setores cadastrados
      const setores: Setor[] = await this.setorRepository.find({
        loadEagerRelations: false,
        relations: {
          orgao: true
        },
        order: {
          orgao: {
            nome: 'ASC'
          }
        }
      });

      // Retorna a lista de setores
      return new ResponseGeneric<Setor[]>(setores);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os setores. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  
  // Listagem paginada de todos os setores
  async findAllByOrgao(userToken: IdDto, idPublic: string) {
    try {
      console.log('userToken', userToken, 'idPublic', idPublic);
      
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

      // Verifica as condições da pesquisa e complementa
      if (idPublic != '' && isAdmin) whereUsed.orgao = { idPublic: idPublic };
      if (idPublic != '' && isGestor) whereUsed = { idPublic: usuario.setor.idPublic };

      console.log('whereUsed.orgao', whereUsed.orgao);
      console.log('whereUsed', whereUsed);
      

      // Busca no banco todos os setores cadastrados
      const setores: Setor[] = await this.setorRepository.find({
        relations: {
          orgao: true
        },
        where: whereUsed,
        order: {
          nome: 'ASC'
        }
      });

      // Verifica se foi encontrado um setores
      if (!setores) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado nenhum setor com esta identificação. ';
      }

      console.log(setores);
      

      // Retorna lista de setores
      return new ResponseGeneric<Setor[]>(setores);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os setores. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Listagem paginada de todos os setores
  async findAllByParameter(parameter: string, idPublic: string, page: number, size: number) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'
      // Cria variável para pesquisa
      const whereUsed: any[] = [
        {
          nome: ILike(parameter)
        },
        {
          orgao: {
            sigla: ILike(parameter)
          }
        },
        {
          orgao: {
            nome: ILike(parameter)
          }
        }
      ].map((conditions) => {
        const r: any = { ...conditions };
        // Verifica as condições da pesquisa e complementa
        if (idPublic != '') r.orgao = { idPublic: idPublic };
        return r;
      });

      // Busca no banco todos os setores cadastrados
      const [setores, total]: [Setor[], number] = await this.setorRepository.findAndCount({
        relations: {
          usuario: true,
          orgao: true
        },
        where: whereUsed,
        order: {
          nome: 'DESC'
        },
        take: size,
        skip: size * page
      });

      // Retorna lista de setores
      return new ResponseGeneric<PaginationInterface<Setor[]>>({
        content: setores,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os setores. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Lista setores por perfil
  async findAllByUserSetor(userToken: IdDto) {
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

      // if (!isAdmin) {
      //   whereUsed = isGestor ? { idPublic: usuario.setor.idPublic } : { orgao: { idPublic: usuario.setor.orgao.idPublic } }
      // }

      // Verifica as condições da pesquisa e complementa
      if (isAdmin) whereUsed.orgao = { idPublic: usuario.setor.orgao.idPublic };
      if (isGestor) whereUsed = { idPublic: usuario.setor.idPublic };

      // Busca no banco todos os setores cadastrados
      const setores: Setor[] = await this.setorRepository.find({
        relations: {
          orgao: true
        },
        where: whereUsed,
        order: {
          orgao: {
            nome: 'ASC'
          }
        }
      });

      // Retorna lista de setores
      return new ResponseGeneric<Setor[]>(setores);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os setores. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findOne(idPublic: string) {
    try {
      // Busca no banco um setor com o idPublic informado
      const setor: Setor = await this.setorRepository.findOne({
        relations: {
          orgao: true
        },
        where: {
          idPublic: idPublic
        }
      })

      // Verifica se foi encontrado algum setor
      if (!setor) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Setor com esta identificação: ' + idPublic;
      }

      // Retorna setor encontrado
      return await new ResponseGeneric<Setor>(setor);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar Setor. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async update(idPublic: string, body: UpdateSetorDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Busca no banco um setor com o idPublic informado
      const setorCheck: Setor = await this.setorRepository.findOne({
        loadEagerRelations: false,
        select: ['id', 'idPublic'],
        relations: {
          orgao: true
        },
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado um setor
      if (!setorCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Setor com esta identificação: ' + idPublic;
      }
      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3));

      // Salva no corpo id do setor encontrado
      body.id = setorCheck.id;
      // Salva no corpo idPublic do setor encontrado
      body.idPublic = setorCheck.idPublic;

      // Atualiza dados do setor com o idPublic informado
      await queryRunner.manager.save(Setor, body)

      // Busca no banco um setor com o idPublic informado
      const setor: Setor = await queryRunner.manager.findOneBy(Setor, { idPublic });

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna setor modificado
      return new ResponseGeneric<Setor>(setor);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retornar mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Setor. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async remove(idPublic: string) {
    try {
      // Busca no banco um setor com o idPublic informado
      const setor: Setor = await this.setorRepository.findOneBy({
        idPublic: idPublic
      })

      // Verifica se foi encontrado algum setor
      if (!setor) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Setor com esta identificação: ' + idPublic;
      }

      // Deleta a setor com o idPublic informado
      await this.setorRepository.delete({ idPublic })

      // Returna mensagem de sucesso
      return new ResponseGeneric<Setor>(null, 'Setor deletado com sucesso.');
    } catch (error) {
      // Verifica se o erro retornado é de existência de tabelas relacionadas
      if (error && error.code == '23503') {
        // Define mensagem de erro
        error = "Existem registros na tabela '" + error.table + "' que dependem deste Setor."
      }

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Setor. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
}
