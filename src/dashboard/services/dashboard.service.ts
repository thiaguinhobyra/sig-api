import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Setor } from 'src/setor/entities/setor.entity';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Between, DataSource, ILike, In, Repository } from 'typeorm';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import { Dashboard } from '../entities/dashboard.entity';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { IdDto } from 'src/utils/id.dto';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { PerfilEnum } from 'src/perfil/enums/perfilEnum.enum';
import { GetDashboardDto } from '../dto/get-dashboard.dto';
import { Orgao } from 'src/orgao/entities/orgao.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
    private dataSource: DataSource,
  ) { }

  async create(body: CreateDashboardDto) {
    try {
      // Busca Perfis do Usuário
      const perfis: Perfil[] = await this.dataSource.getRepository(Perfil).findBy({ id: In(body.perfil.map(p => p.id)) });

      // Verifica se o perfil existe
      if (!perfis) {
        throw 'Perfil não encontrado. '
      }

      const orgao: Orgao = await this.dataSource.getRepository(Orgao).findOneBy({ id: body.orgao.id });

      // Verifica se o orgao existe
      if (!orgao) {
        // Retorna mensagem de erro
        throw 'Orgão não encontrado. '
      }

      const setor: Setor = await this.dataSource.getRepository(Setor).findOneBy({ id: body.setor.id });

      // Verifica se o setor existe
      if (!setor) {
        // Retorna mensagem de erro
        throw 'Setor não encontrado. '
      }


      const dashboard = await this.dashboardRepository.save(body)

      const dashboardReturn: Dashboard = await this.dashboardRepository.findOneBy({ id: dashboard.id });

      // Retorna dados do usuário cadastrado
      return new ResponseGeneric<Dashboard>(dashboardReturn);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível cadastrar o dashboard. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAll(idPublic: string, page: number, size: number, userToken: IdDto) {
    try {
      // Cria array de dto de get usuario pendente
      const getDashboards: GetDashboardDto[] = [];
      // Cria variável de total de get usuario pendente
      let total: number = 0;
      // Busca usuario logado
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          setor: {
            orgao: true
          }
        },
        where: { id: userToken.id }
      });
      if (usuario.perfil.nome == PerfilEnum.Admin) {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          // .where("perfil.nome = :nome", { nome: PerfilEnum.Admin })
          .groupBy('dashboard.id, dashboard.nome, dashboard.url, dashboard.ativo, dashboard.home, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          getDashboards.push(getDashboard);

        }

      } else if (usuario.perfil.nome == PerfilEnum.Gestor) {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("perfil.nome = :nome", { nome: PerfilEnum.Gestor })
          .andWhere("dashboard.ativo = true")
          .groupBy('dashboard.id, dashboard.id_public, dashboard.nome, dashboard.url, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          // Adiciona dto ao array
          if (!getDashboards.some((p) => p.idPublic == getDashboard.idPublic)) {
            getDashboards.push(getDashboard);
          }
        }
      } else {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("perfil.nome = :nome", { nome: PerfilEnum.Usuario })
          .andWhere("dashboard.ativo = true")
          .groupBy('dashboard.id, dashboard.id_public, dashboard.nome, dashboard.url, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          // Adiciona dto ao array
          if (!getDashboards.some((p) => p.idPublic == getDashboard.idPublic)) {
            getDashboards.push(getDashboard);
          }
        }
      }
      // Retorna a lista de usuários
      return new ResponseGeneric<PaginationInterface<GetDashboardDto[]>>({
        content: getDashboards,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Dashboards para home.', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findAllDashboardMenu(userToken: IdDto) {
    try {
      // Cria array de dto de get usuario pendente
      const getDashboards: GetDashboardDto[] = [];

      // Busca usuario logado
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          setor: {
            orgao: true
          }
        },
        where: { id: userToken.id }
      });     

      if (usuario.perfil.nome == PerfilEnum.Admin) {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("dashboard.ativo = true")
          .andWhere("perfil.nome = :nome", { nome: PerfilEnum.Admin })
          .groupBy('dashboard.id, dashboard.nome, dashboard.url, dashboard.ativo, dashboard.home, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          getDashboards.push(getDashboard);

        }
      }

      // Retorna a lista de usuários
      return new ResponseGeneric<GetDashboardDto[]>(getDashboards);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Dashboards para home.', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findAllDashboardHome(idPublic: string, page: number, size: number, userToken: IdDto) {
    try {
      // Cria array de dto de get dashboards
      const getDashboards: GetDashboardDto[] = [];
      // Cria variável de total de get dashboards
      let total: number = 0;
      // Busca usuario logado
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          setor: {
            orgao: true
          }
        },
        where: { id: userToken.id }
      });
      
      if (usuario.perfil.nome == PerfilEnum.Admin) {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("dashboard.home = true")
          .andWhere("perfil.nome = :nome", { nome: PerfilEnum.Admin })
          .andWhere("dashboard.ativo = true")
          .groupBy('dashboard.id, dashboard.nome, dashboard.url, dashboard.ativo, dashboard.home, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          getDashboards.push(getDashboard);

        }

      } else if (usuario.perfil.nome == PerfilEnum.Gestor) {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("dashboard.home = true")
          .andWhere("perfil.nome = :nome", { nome: PerfilEnum.Gestor })
          .andWhere("setor.id_public = :idPublic", { idPublic: idPublic })
          .andWhere("dashboard.ativo = true")
          .groupBy('dashboard.id, dashboard.id_public, dashboard.nome, dashboard.url, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          // Adiciona dto ao array
          if (!getDashboards.some((p) => p.idPublic == getDashboard.idPublic)) {
            getDashboards.push(getDashboard);
          }
        }
      } else {
        // Busca dashboards com viagens pendentes
        const dashboards = await this.dataSource.getRepository(Dashboard).createQueryBuilder('dashboard')
          .select(["dashboard.idPublic", "dashboard.nome", "dashboard.url", "dashboard.icone", "dashboard.ativo", "dashboard.home"])
          .addSelect('orgao')
          .addSelect('perfil')
          .innerJoin(Setor, 'setor', 'dashboard.fk_setor = setor.id')
          .innerJoin("dashboard.perfil", "perfil")
          .innerJoin(Orgao, 'orgao', 'dashboard.fk_orgao = orgao.id')
          .where("perfil.nome = :nome", { nome: PerfilEnum.Usuario })
          .andWhere("dashboard.fk_setor = :id", { id: usuario.setor.id })
          .andWhere("dashboard.ativo = true")
          .groupBy('dashboard.id, dashboard.id_public, dashboard.nome, dashboard.url, orgao.id, perfil.id')
          .orderBy("dashboard.id", "DESC")
          .getRawMany();

        for await (const dashboard of dashboards) {
          // Cria variáavel de dto de get usuario pendente
          let getDashboard: GetDashboardDto = new GetDashboardDto();

          getDashboard.nome = dashboard.dashboard_nome;
          getDashboard.url = dashboard.dashboard_url;
          getDashboard.icone = dashboard.dashboard_icone;
          getDashboard.idPublic = dashboard.dashboard_id_public;

          // Adiciona dto ao array
          if (!getDashboards.some((p) => p.idPublic == getDashboard.idPublic)) {
            getDashboards.push(getDashboard);
          }
        }
      }
      // Retorna a lista de usuários
      return new ResponseGeneric<PaginationInterface<GetDashboardDto[]>>({
        content: getDashboards,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Dashboards para home.', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findAllBySetorAndPeriodo(userToken: IdDto, idPublicSetor: string, dataInicio: Date, dataFim: Date, parameter: string, idPublic: string, page: number, size: number) {
    try {

      // Busca usuario logado
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        loadEagerRelations: false,
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

      // Verifica se as datas são do dia corrente
      if (!dataInicio) {
        // Cria valor de data inicio
        dataInicio = new Date(new Date().setHours(new Date().getHours() - 3));
        // Substitui valor contendo o primeiro dia do mês selecionado
        dataInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      }
      if (!dataFim) {
        // Cria valor de data fim
        dataFim = new Date(new Date().setHours(new Date().getHours() - 3));
        // Substitui valor contendo o Último dia do mês
        dataFim = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
      }

      // Atribui ultima hora, minuto, segundo e milessimo de segundo à data fim
      dataFim.setHours(23, 59, 59, 999);

      // Cria variável para pesquisa
      const whereUsed: any = {
        nome: ILike('%' + parameter + '%'),
        createdAt: Between(dataInicio, dataFim)
      }

      // Verifica as condições da pesquisa e complementa
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      if (isAdmin) {
        if (idPublicSetor) whereUsed.setor = { idPublic: idPublicSetor };
        // if (idPublic) whereUsed.idPublic = idPublic;

      } else if (idPublicSetor) {
        if (isGestor) {
          whereUsed.setor = { idPublic: usuario.setor.idPublic }

        } else {
          const setores: Setor[] = await this.dataSource.getRepository(Setor).find({
            loadEagerRelations: false,
            where: {
              idPublic: idPublicSetor
            }
          });
          whereUsed.setor = (setores.some(setores => setores.orgao.idPublic == usuario.setor.orgao.idPublic)) ? { idPublic: idPublicSetor } : { idPublic: usuario.setor.idPublic }

        };
        // whereUsed.usuario.ativo == true;
      } else {

        whereUsed.setor = { idPublic: usuario.setor.idPublic };

        // whereUsed.servidor.ativo == true;
      };

      // if (idPublicStatus) {
      //   whereUsed.status = { idPublic: idPublicStatus }
      // };

      // Busca dashboards no banco de acordo com os parametros
      const [dashboards, total]: [Dashboard[], number] = await this.dashboardRepository.findAndCount({
        loadEagerRelations: false,
        select: ['id', 'idPublic', 'url', 'nome', 'icone', 'home', 'perfil', 'setor', 'orgao', 'ativo', 'createdAt'],
        relations: {
          setor: true,
          orgao: true,
          perfil: true,
        },
        where: whereUsed,
        order: { createdAt: 'DESC' },
        take: size,
        skip: size * page
      })

      if (!dashboards) {
        throw 'Dashboard não encontrado. '
      }

      // Retorna lista de dashboards
      return new ResponseGeneric<PaginationInterface<Dashboard[]>>({
        content: dashboards,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {

      // Retorna mensagem de erro
      throw new HttpException({ message: "Não foi possível listar Dashboards. ", code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAllByOrgaoAndPeriodo(userToken: IdDto, idPublicOrgao: string, idPublicSetor: string, dataInicio: Date, dataFim: Date, parameter: string, page: number, size: number) {
    try {
      // Busca usuario logado
      const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOne({
        loadEagerRelations: false,
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

      // Cria variável para pesquisa
      const whereUsed: any = {
        nome: ILike('%' + parameter + '%'),
      }
      if (dataInicio || dataFim) {
        // Verifica se as datas são informadas
        if (!dataInicio) {
          // Cria valor de data inicio
          dataInicio = new Date(new Date().setHours(new Date().getHours() - 3));
          // Substitui valor contendo o primeiro dia do mês selecionado
          dataInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
        }
        if (!dataFim) {
          // Cria valor de data fim
          dataFim = new Date(new Date().setHours(new Date().getHours() - 3));
          // Substitui valor contendo o Último dia do mês
          dataFim = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
        }

        // Atribui ultima hora, minuto, segundo e milessimo de segundo à data fim
        dataFim.setHours(23, 59, 59, 999);

        whereUsed.createdAt = Between(dataInicio, dataFim)
      }

      // Verifica as condições da pesquisa e complementa
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      // Verifica as condições da pesquisa e complementa
      if (isAdmin) {
        if (idPublicOrgao != '') whereUsed.orgao = { idPublic: idPublicOrgao };
      } else if (idPublicSetor) {
        if (isGestor) {
          whereUsed.setor = { idPublic: usuario.setor.idPublic }
        } else {
          const setor: Setor[] = await this.dataSource.getRepository(Setor).find({
            loadEagerRelations: false,
            where: {
              idPublic: idPublicSetor
            }
          });
          whereUsed.setor = (setor.some(orgao => orgao.idPublic == usuario.setor.orgao.idPublic)) ? { idPublic: idPublicSetor } : { idPublic: usuario.setor.idPublic }
        };
        // whereUsed.usuario.ativo == true;
      } else {
        whereUsed.setor = { idPublic: usuario.setor.idPublic };
      };

      // Busca dashboards no banco de acordo com os parametros
      const [dashboards, total]: [Dashboard[], number] = await this.dashboardRepository.findAndCount({
        loadEagerRelations: false,
        select: ['id', 'idPublic', 'url', 'nome', 'icone', 'home', 'perfil', 'setor', 'orgao', 'ativo', 'createdAt'],
        relations: {
          setor: true,
          orgao: true,
          perfil: true,
        },
        where: whereUsed,
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
        take: size,
        skip: size * page
      })

      if (!dashboards) {
        throw 'Dashboard não encontrado. '
      }

      // Retorna lista de dashboards
      return new ResponseGeneric<PaginationInterface<Dashboard[]>>({
        content: dashboards,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Dashboards. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findOne(idPublic: string) {
    try {
      // Busca no banco todos os dashboards cadastrados
      const dashboard: Dashboard = await this.dashboardRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        select: ['id', 'idPublic', 'url', 'nome', 'icone', 'home', 'perfil', 'setor', 'orgao', 'ativo', 'createdAt'],
        relations: {
          perfil: true,
          setor: true,
          orgao: true
        },
        where: {
          idPublic,
          // ativo: true,
        }
      });

      // Verifica se foi encontrado algum dashboard
      if (!dashboard) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Dashboard com esta identificação: ' + idPublic;
      }

      

      // Retorna lista de dashboards
      return await new ResponseGeneric<Dashboard>(dashboard)
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar o Dashboard. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async update(idPublic: string, body: UpdateDashboardDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um dashboard com o idPublic informado
      const dashboardOriginal: Dashboard = await this.dashboardRepository.findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          setor: true,
          orgao: true
        },
        where: {
          idPublic,
        }
      })

      // Verifica se foi encontrado algum dashboard
      if (!dashboardOriginal) {
        // Retorna mensagem de erro
        throw 'Não foi possível encontrar o Dashboard com esta identificação: ' + idPublic
      }

      // Salva no corpo id do dashboard encontrado
      body.id = dashboardOriginal.id;
      // Salva no corpo idPublic do dashboard encontrado
      body.idPublic = dashboardOriginal.idPublic;
      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3))

      // Atualiza no banco dados do dashboard com o id igual ao contido no body
      await queryRunner.manager.save(Dashboard, body);

      // Busca no banco um dashboard com o idPublic informado
      const dashboard: Dashboard = await queryRunner.manager.findOneBy(Dashboard, { idPublic: idPublic })

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna dashboard modificado
      return new ResponseGeneric<Dashboard>(dashboard);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Dashboard. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async remove(idPublic: string, userToken: any) {
    try {
      // Busca no banco um dashboard com o idPublic informado
      const dashboardReturn: Dashboard = await this.dashboardRepository.findOne({
        loadEagerRelations: false,
        where: {
          idPublic,
          ativo: true
        },
        select: ['id', 'idPublic', 'url', 'ativo'],
        relations: {
          setor: true,
          perfil: true,
          orgao: true
        }
      })

      // Verifica se foi encontrado algum dashboard
      if (!dashboardReturn) {
        // Retorna mensagem de erro
        throw 'Não foi possível encontrar o Dashboard com esta identificação: ' + idPublic
      }


      // Verifica se usuário não está tentando excluir o dashboard de outro orgão ou setor
      if (userToken.perfil.nome != PerfilEnum.Admin && dashboardReturn.setor.id != userToken.setor.id) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para excluir dashboard de outro orgão ou setor. ';
      }
      
      await this.dashboardRepository.createQueryBuilder()
      .relation(Dashboard, 'perfil')
      .of(dashboardReturn)
      .remove(dashboardReturn.perfil);

      const returnDelete = await this.dashboardRepository.delete({
        idPublic: dashboardReturn.idPublic
      });

      // Returna mensagem de sucesso
      return new ResponseGeneric<Dashboard>(null, returnDelete.affected + ' Dashboard deletado com sucesso.');
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Dashboard. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
}
