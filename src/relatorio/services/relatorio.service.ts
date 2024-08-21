import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auxiliar } from 'src/auxiliar/entities/auxiliar.entity';
import { keyAuxiliarEnum } from 'src/auxiliar/enum/keyAuxiliar.enum';
import { statusRegistroEnum } from 'src/auxiliar/enum/statusRegistro.enum';
import { PerfilEnum } from 'src/perfil/enums/perfilEnum.enum';
import { Setor } from 'src/setor/entities/setor.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { IdDto } from 'src/utils/id.dto';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { ResponseGeneric } from 'src/utils/response.generic';
import { Between, DataSource, ILike, In, Not, Repository } from 'typeorm';
import { CreateRelatorioDto } from '../dto/create-relatorio.dto';
import { GetRelatorioDto } from '../dto/get-relatorio.dto';
import { ImportRelatorioDto } from '../dto/import-relatorio.dto';
import { UpdateRelatorioDto } from '../dto/update-relatorio.dto';
import { Relatorio } from '../entities/relatorio.entity';
import { tipoRegistroEnum } from 'src/auxiliar/enum/tipoRegistro.enum';

@Injectable()
export class RelatorioService {
  constructor(
    @InjectRepository(Relatorio)
    private relatorioRepository: Repository<Relatorio>,
    private dataSource: DataSource,
    @InjectRepository(Relatorio, 'second') private readonly repositoryRelatorioRedmine: Repository<Relatorio>,
    @InjectRepository(Relatorio, 'third') private readonly repositoryRelatorioOtrs: Repository<Relatorio>
  ) { }
  private readonly logger = new Logger(RelatorioService.name);


  async saveReports(reports: any[]): Promise<void> {
    const relatorios = reports.map(report => {
      const relatorio = new Relatorio();
      relatorio.projeto = report.nome;
      relatorio.ativo = report.ativo;
      relatorio.setor = report.setor;
      return relatorio;
    });

    try {
      await this.relatorioRepository.save(relatorios);
    } catch (error) {
      throw new Error(`Erro ao salvar relatórios na db1: ${error.message}`);
    }
  }

  async create(body: CreateRelatorioDto) {
    try {
      // Busca Perfis do Usuário
      const responsavel: Usuario = await this.dataSource.getRepository(Usuario).findOneBy({ id: body.responsavel.id });

      // Verifica se o responsavel existe
      if (!responsavel) {
        throw 'Responsável não encontrado. '
      }

      const setor: Setor = await this.dataSource.getRepository(Setor).findOneBy({ id: body.setor.id });

      // Verifica se o setor existe
      if (!setor) {
        // Retorna mensagem de erro
        throw 'Setor não encontrado. '
      }

      const relatorio = await this.relatorioRepository.save(body)

      const relatorioReturn: Relatorio = await this.relatorioRepository.findOneBy({ id: relatorio.id });

      // Retorna dados do usuário cadastrado
      return new ResponseGeneric<Relatorio>(relatorioReturn);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível cadastrar o relatorio. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async createAll(body: ImportRelatorioDto[]) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    // Cria boolean para gerenciamento de sucesso
    let success: boolean;

    // Cria array para inclusão de erros
    const erros: string[] = [];
    try {
      // Captura as importações dos relatórios em um array de objeto json
      const importado = body;

      // // Verifica se as importações foram encontradas
      // if (JSON.stringify(importado[0]) === '{}') {
      //   // Retorna erro
      //   throw 'Nenhuma relatório foi encontrada.';
      // }

      const relatorios: Relatorio[] = [];

      // Mapeia parse para tratativa dos dados
      for await (let data of importado) {
        // Chama função que busca os dados do csv
        let relatorio: Relatorio = new Relatorio();

        const relatorioCheck: Relatorio = await this.relatorioRepository.findOneBy({ idTarefa: data.id });
        if (relatorioCheck) {
          // Adiciona ids aos dados do relatorioCheck
          relatorio.id = relatorioCheck.id;
          relatorio.idPublic = relatorioCheck.idPublic
        }

        // Atribui horas à variável
        relatorio.horas = '0:00';

        // Atribui valorTarefa à variável
        let valorTarefa = 0;

        if (data.responsavel && data.responsavel != null) {

          // Trata possíveis inconsistências no email
          const responsavel: string = await data.responsavel.trim().toLowerCase();

          // Busca responsavel no banco de acordo com o email
          const usuario: Usuario = await this.dataSource.getRepository(Usuario).findOneBy([
            {
              email: ILike('%' + responsavel + '%')
            }
          ]);
          // Verifica se foi encontrado o responsavel
          if (!usuario) {
            // Retorna erro
            erros.push(" Usuário não encontrado. Identificação: " + responsavel + ".<br>");
          }
          // Adiciona responsavel ao relatorio
          relatorio.responsavel = usuario;

          // cria variável
          let valorHora: number = 0;

          // cria variável
          let salario: number = 0;
          // Atribui valor às variável
          salario = usuario.salario;

          // cria variável
          let jornada: number = 0;
          // Atribui valor às variável
          jornada = usuario.jornada;

          // Calcula valor da hora
          valorHora = (salario / jornada);

          // Verifica se tempo não é nulo ou indefinido
          if (data.horas != null && data.horas != undefined && data.horas != ':') {
            // Dividir a string usando ":" como separador
            let partes = data.horas.split(':');

            // Extrair horas e minutos
            let horas = parseInt(partes[0]);
            let minutos = parseInt(partes[1]);

            let horasDecimal: number = Number(horas + (minutos / 60));

            valorTarefa = valorHora * horasDecimal;

            // Atribui horas à variável
            relatorio.horas = data.horas;
          }
          // Atribui valorHora à variável
          relatorio.valorHora = Number(valorHora);

          // Atribui setor à variável
          relatorio.setor = usuario.setor;
        }
        if (data.descricao) {
          // Atribui valor a variável
          relatorio.descricao = data.descricao;
        }
        // Atribui valorTarefa à variável
        relatorio.valorTarefa = Number(valorTarefa);

        let valorStatus = '';

        if (data.status == 'closed successfully') {
          valorStatus = statusRegistroEnum.FECHADO_COM_SUCESSO;
        } else if (data.status != 'Concluída' && data.status != 'closed successfully') {
          if (data.status == 'closed automatic pending+') {
            valorStatus = statusRegistroEnum.FECHADO_AUTOMATICO_PENDENTE;
          } else if (data.status == 'closed unsuccessful') {
            valorStatus = statusRegistroEnum.FECHADO_SEM_SUCESSO;
          } else if (data.status == 'closed with workaround') {
            valorStatus = statusRegistroEnum.FECHADO_COM_SOLUÇÃO_ALTERNATIVA;
          } else {
            valorStatus = statusRegistroEnum.CANCELADO;
          }
        } else {
          valorStatus = statusRegistroEnum.CONCLUIDA;
        }
        // Busca status da viagem
        const status: any = await this.dataSource.getRepository(Auxiliar).findOneBy({
          descricao: valorStatus,
          chave: keyAuxiliarEnum.STATUS_REGISTRO
        });

        if (!status) {
          // Retorna erro
          erros.push(" Status não encontrado. Identificação: " + status + ".<br>");
        }
        // Adiciona status ao relatório
        relatorio.status = status;


        let valorTipoRegistro = '';

        if (data.tipo_registro == 'redmine') {
          valorTipoRegistro = tipoRegistroEnum.PROJETO;
        } else {
          valorTipoRegistro = tipoRegistroEnum.CHAMADO;
        }

        // Busca tipo_registro da viagem
        const tipo_registro: any = await this.dataSource.getRepository(Auxiliar).findOneBy({
          descricao: valorTipoRegistro,
          chave: keyAuxiliarEnum.TIPO_REGISTRO
        });

        if (!tipo_registro) {
          // Retorna erro
          erros.push(" Tipo de registro não encontrado. Identificação: " + tipo_registro + ".<br>");
        }
        relatorio.tipo_registro = tipo_registro;

        // Atribui valores às variáveis
        relatorio.projeto = data.projeto;
        relatorio.idTarefa = data.id;
        relatorio.tarefa = data.tarefa;
        relatorio.tipoTarefa = data.tipo_tarefa;
        relatorio.dataInicio = data.inicio;
        relatorio.dataFim = data.fim;
        relatorio.dataFechamento = data.fechamento;

        // Envia relatórios ao array
        relatorios.push(relatorio);

        // Retorna erros encontrados, se houverem mais de 10 erros
        if (erros.length > 10) {
          throw erros;
        }
      }

      // Retorna erros encontrados, se houverem erros
      if (erros.length > 0) {
        throw erros;
      }

      // Salva relatorios no banco sig
      const relatorioSave = await queryRunner.manager.save(Relatorio, relatorios);

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Altera parametro de sucesso
      success = true;

      // Retorna dados do usuário cadastrado
      return new ResponseGeneric<Relatorio[]>(relatorioSave);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();
      // Altera parametro de sucesso
      success = false;
      console.error(error);
      // Retorna mensagem de erro
      throw 'Não foi possível cadastrar o relatorio. ' + erros.join('||');
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async findImportsFromRedmine(dataInicio: Date, dataFim: Date) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Envia mensagem de início
      this.logger.debug('Start! Called job import Relatorio Redmine.');

      // Verifica se as datas são informadas
      if (dataInicio == null && dataInicio == undefined) {
        // Cria valor de data inicio
        dataInicio = new Date(new Date().setHours(new Date().getHours() - 3));
        // Substitui valor contendo o primeiro dia do mês selecionado
        dataInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
      }
      if (dataFim == null && dataFim == undefined) {
        // Cria valor de data fim
        dataFim = new Date(new Date().setHours(new Date().getHours() - 3));
        // Substitui valor contendo o Último dia do mês
        dataFim = new Date(dataFim.getFullYear(), dataFim.getMonth() + 1, 0);
      }

      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);

      const queryRedmine = `
      select p.id || ' ' || p.subject as projeto,
      i.id,
      i.subject as tarefa,
      u.login as responsavel,
      t.name as tipo_tarefa,
      is2."name" as status,
      i.start_date as inicio ,
      i.due_date as fim,
      i.closed_on as fechamento,
      i.description as descricao,
      'redmine' as tipo_registro,
      float_to_time((select sum(hours) 
      from time_entries te where te.issue_id = i.id)) as horas,
      cv6.value AS setor
      from issues i
      left join issues p on p.id  = i.root_id  
      left join trackers t on t.id  = i.tracker_id  
      left join issue_statuses is2 on i.status_id = is2.id 
      left join users u on i.assigned_to_id = u.id
      LEFT JOIN custom_values cv6 ON cv6.customized_id = u.id AND cv6.custom_field_id = 6
      where i.updated_on between $1 and $2  
      and is2.id in (5,6)
      AND t.id NOT IN (15,8,11,7,6,10);
      `;

      if (!queryRedmine) {
        throw 'Query não realizada';
      }

      const relatorioRedmine = await this.repositoryRelatorioRedmine.query(queryRedmine, [dataInicio, dataFim]);


      // Recebe dados do banco redmine e salva no sig
      const relatorio = await this.createAll(relatorioRedmine);

      // Verifica se relatorio veio vazio
      if (!relatorio) {
        throw 'Relatório não pôde ser salvo na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job import Relatorio Redmine.');

      return new ResponseGeneric<Relatorio[]>(relatorioRedmine);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar dados do Redmine. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async findImportsFromOtrs(dataInicio: Date, dataFim: Date) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {

      // Envia mensagem de início
      this.logger.debug('Start! Called job import Relatorio OTRS.');

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

      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);

      // const date = '2023-12-01';

      const queryOtrs = `
      select 
      'chamado' as projeto,
      t.tn as id,
      s.name as tarefa,
	    CONVERT(up.preferences_value USING utf8) as responsavel,
      tt.name as tipo_tarefa,
      ts.name as status,
      t.create_time as inicio,
      th.change_time as fim,
      th.change_time as fechamento,
      t.title as descricao,
      q.name AS setor,
      'otrs' as tipo_registro,
      float_to_time(SUM(ta.time_unit)) as horas
      from ticket t
      inner join users u on u.id  = t.user_id
      inner join queue q on q.id  = t.queue_id
      inner join ticket_type tt on tt.id  = t.type_id
      inner join ticket_state ts on ts.id  = t.ticket_state_id
      left join time_accounting ta on ta.ticket_id  = t.id
      inner join service s on s.id  = t.service_id
      inner join ticket_history th on th.ticket_id = t.id and th.history_type_id = 27 and th.state_id in (2,3,7,8,10)
      inner join user_preferences up on up.user_id = u.id AND up.preferences_key = 'UserEmail'
      where t.change_time between ? and ? and t.ticket_state_id in (2,3,7,8,10)
      GROUP by 1,2,3,4,5,6,7,8,9,10,11,12
      `;

      if (!queryOtrs) {
        throw 'Query não realizada';
      }

      const relatorioOtrs = await this.repositoryRelatorioOtrs.query(queryOtrs, [dataInicio, dataFim]);

      // Recebe dados do banco OTRS e salva no sig
      const relatorio = await this.createAll(relatorioOtrs);

      // Verifica se relatorio veio vazio
      if (!relatorio) {
        throw 'Relatório do ORTS não pôde ser salvo na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job import Relatorio OTRS.');

      return new ResponseGeneric<Relatorio[]>(relatorioOtrs);

    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar dados do OTRS. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  // Busca os relatorios
  async findAll(parameter: string, page: number, size: number) {
    try {

      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      // Busca no banco todos os relatorios cadastrados
      const [relatorios, total]: [Relatorio[], number] = await this.relatorioRepository.findAndCount({
        loadEagerRelations: false,
        withDeleted: true,
        relations: {
          responsavel: true,
          setor: {
            orgao: true
          },
          perfil: {
            permission: true
          },
          status: true,
          tipo_registro: true
        },
        // select: ['projeto', 'idTarefa', 'tarefa', 'tipoTarefa', 'status', 'dataInicio', 'dataFim', 'descricao', 'horas', 'valorHora', 'ativo', 'setor', 'responsavel', 'perfil', 'responsavel', 'setor', 'perfil'],
        where: [
          {
            projeto: ILike(parameter)
          },
          {
            responsavel: {
              nome: ILike(parameter)
            }
          },
          {
            setor: {
              nome: ILike(parameter)
            }
          }
        ],
        take: size,
        skip: size * page
      });

      // Retorna lista de relatorios
      return await new ResponseGeneric<PaginationInterface<Relatorio[]>>({
        content: relatorios,
        total: total,
        totalPages: Math.ceil(total / size),
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar os relatorios. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async totaisRelatorio(userToken: IdDto, idPublicOrgao: string, idPublicSetor: string, idPublicRegistro: string, idPublicEmpresa: string, dataInicio: Date, dataFim: Date, parameter: string) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      // Busca usuario logado
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

      // Cria variável para pesquisa
      const whereUsed: any = {
        // projeto: ILike(parameter),
        responsavel: {
          nome: ILike(parameter)
        },
        status: {
          descricao: Not(In([statusRegistroEnum.CANCELADO]))
        },
        dataFim: Between(dataInicio, dataFim)
      }
      // Verifica as condições da pesquisa e complementa
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      if (isAdmin) {
        if (idPublicSetor) whereUsed.setor = { idPublic: idPublicSetor };
        if (idPublicOrgao) whereUsed.setor = { orgao: { idPublic: idPublicOrgao } };

      } else if (isGestor) {
        if (!idPublicSetor) {
          whereUsed.setor = { idPublic: usuario.setor.idPublic }
        } else {
          const setor: Setor[] = await this.dataSource.getRepository(Setor).find({
            where: {
              idPublic: idPublicSetor
            }
          });
          whereUsed.setor = (setor.some(setor => setor.orgao.idPublic == usuario.setor.orgao.idPublic)) ? { idPublic: idPublicSetor } : { idPublic: usuario.setor.idPublic }
        };
      } else {
        whereUsed.responsavel = { idPublic: usuario.idPublic };
      };

      if (idPublicRegistro) whereUsed.tipo_registro = { idPublic: idPublicRegistro };
      if (idPublicEmpresa) whereUsed.responsavel = { empresa: { idPublic: idPublicEmpresa } };

      // Busca relatorios no banco de acordo com os parametros
      const relatorios: Relatorio[] = await this.relatorioRepository.find({
        loadEagerRelations: false,
        relations: {
          responsavel: {
            empresa: true
          },
          setor: {
            orgao: true
          },
          perfil: true,
          status: true,
          tipo_registro: true
        },
        where: whereUsed,
        order: {
          dataFechamento: 'DESC',
        }
      })

      if (!relatorios) {
        throw 'Relatório não encontrado. '
      }

      let relatorio: GetRelatorioDto = new GetRelatorioDto();

      // Adiciona número total de relatorios ao body
      relatorio.totalRegistros = Number(relatorios.length);
      // Adiciona valor 0 para que a soma possa ser efetuada corretamente.
      let totalHoras = Number(0);
      relatorio.totalValor = Number(0);
      // Percorre lista de relatorios
      for await (const registro of relatorios) {
        // Dividir a string usando ":" como separador
        let partes = registro.horas.split(':');

        // Extrair horas e minutos
        let horas = parseInt(partes[0]);
        let minutos = parseInt(partes[1]);

        let horasDecimal: number = Number(horas + (minutos / 60));

        // Soma valor de viagem no relatorio
        totalHoras += horasDecimal;

        const horasInteiras = Math.floor(totalHoras);
        const minutosDecimal = (totalHoras - horasInteiras) * 60;
        const minutosInteiros = Math.round(minutosDecimal);

        const horasFormatadas = horasInteiras.toString().padStart(2, '0');
        const minutosFormatados = minutosInteiros.toString().padStart(2, '0');

        const tempoFormatado = `${horasFormatadas}:${minutosFormatados}`;

        // Adiciona total de horas
        relatorio.totalHoras = tempoFormatado || '0:00';
        // Soma as distâncias ao relatorio
        relatorio.totalValor += Number(Number(registro.valorTarefa).toFixed(2));
      }

      // Retorna lista de relatorio
      return new ResponseGeneric<GetRelatorioDto>(relatorio);
    } catch (error) {
      console.error(error);

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Relatorios. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAllBySetorAndPeriodo(userToken: IdDto, idPublicOrgao: string, idPublicSetor: string, idPublicRegistro: string, idPublicEmpresa: string, dataInicio: Date, dataFim: Date, parameter: string, page: number, size: number) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      // Busca usuario logado
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

      // Cria variável para pesquisa
      const whereUsed: any = {
        // projeto: ILike(parameter),
        responsavel: {
          nome: ILike(parameter)
        },
        dataFim: Between(dataInicio, dataFim)
      }

      // // Verifica as condições da pesquisa e complementa
      // if (idPublicOrgao != '') whereUsed.setor = { orgao: { idPublic: idPublicOrgao } };
      // if (idPublicSetor != '') whereUsed.setor = { idPublic: idPublicSetor };

      // Verifica as condições da pesquisa e complementa
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      if (isAdmin) {
        if (idPublicSetor) whereUsed.setor = { idPublic: idPublicSetor };
        if (idPublicOrgao) whereUsed.setor = { orgao: { idPublic: idPublicOrgao } };

      } else if (isGestor) {
        if (idPublicSetor) {
          whereUsed.setor = { idPublic: usuario.setor.idPublic }
        } else {
          const setores: Setor[] = await this.dataSource.getRepository(Setor).find({
            where: {
              idPublic: idPublicSetor
            }
          });
          whereUsed.setor = (setores.some(setores => setores.orgao.idPublic == usuario.setor.orgao.idPublic)) ? { idPublic: idPublicSetor } : { idPublic: usuario.setor.idPublic }
        };
      } else {
        whereUsed.responsavel = { idPublic: usuario.idPublic };
      };

      // if (usuario.perfil.nome == PerfilEnum.Usuario) whereUsed.responsavel = { idPublic: usuario.idPublic };
      if (idPublicRegistro) whereUsed.tipo_registro = { idPublic: idPublicRegistro };
      if (idPublicEmpresa) whereUsed.responsavel = { empresa: { idPublic: idPublicEmpresa } };


      // Busca relatorios no banco de acordo com os parametros
      const [relatorios, total]: [Relatorio[], number] = await this.relatorioRepository.findAndCount({
        loadEagerRelations: false,
        relations: {
          responsavel: {
            empresa: true,
          },
          setor: {
            orgao: true
          },
          perfil: true,
          status: true,
          tipo_registro: true
        },
        where: whereUsed,
        order: {
          dataFechamento: 'DESC',
        },
        take: size,
        skip: size * page
      })

      if (!relatorios) {
        throw 'Relatório não encontrado. '
      }

      // Retorna lista de relatorios
      return new ResponseGeneric<PaginationInterface<Relatorio[]>>({
        content: relatorios,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      console.error(error);

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Relatorios. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findAllByOrgaoAndPeriodo(userToken: IdDto, idPublic: string, idPublicRegistro: string, idPublicEmpresa: string, dataInicio: Date, dataFim: Date, parameter: string, page: number, size: number) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      // Busca usuario logado
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

      const whereUsed: any = {
        // projeto: ILike(parameter),
        responsavel: {
          nome: ILike(parameter)
        },
        dataFim: Between(dataInicio, dataFim)
      }

      // Verifica as condições da pesquisa e complementa
      if (usuario.perfil.nome == PerfilEnum.Admin && idPublic != '') whereUsed.setor = { orgao: { idPublic: idPublic } };
      if (usuario.perfil.nome == PerfilEnum.Gestor && idPublic != '') whereUsed.setor = { idPublic: idPublic };
      if (usuario.perfil.nome == PerfilEnum.Usuario) whereUsed.responsavel = { idPublic: usuario.idPublic };
      if (idPublicRegistro) whereUsed.tipo_registro = { idPublic: idPublicRegistro };
      if (idPublicEmpresa) whereUsed.responsavel = { empresa: { idPublic: idPublicEmpresa } };

      // Busca relatorios no banco de acordo com os parametros
      const [relatorios, total]: [Relatorio[], number] = await this.relatorioRepository.findAndCount({
        loadEagerRelations: false,
        relations: {
          responsavel: {
            empresa: true,
          },
          setor: {
            orgao: true
          },
          perfil: true,
          status: true,
          tipo_registro: true
        },
        where: whereUsed,
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
        take: size,
        skip: size * page
      })

      if (!relatorios) {
        throw 'Relatorio não encontrado. '
      }

      // Retorna lista de relatorios
      return new ResponseGeneric<PaginationInterface<Relatorio[]>>({
        content: relatorios,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Relatorios. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async findOne(idPublic: string) {
    try {
      // Busca no banco todos os relatorios cadastrados
      const relatorio: Relatorio = await this.relatorioRepository.findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          status: true,
          tipo_registro: true
        },
        where: {
          idPublic,
          ativo: true
        }
      });

      // Verifica se foi encontrado algum relatorio
      if (!relatorio) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Relatorio com esta identificação: ' + idPublic;
      }

      // Retorna lista de relatorios
      return await new ResponseGeneric<Relatorio>(relatorio)
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar o Relatorio. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * TODO: paginar
   * @param idPublic 
   * @returns 
   */
  async findOneuUsuario(idPublic: string) {
    try {
      // Busca no banco todos os relatorios cadastrados
      const relatorio: Relatorio = await this.relatorioRepository.findOne({
        loadEagerRelations: false,
        relations: {
          perfil: true,
          status: true,
          tipo_registro: true
        },
        where: {
          idPublic,
          ativo: true
        }
      });

      // Verifica se foi encontrado algum relatorio
      if (!relatorio) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Relatorio com esta identificação: ' + idPublic;
      }

      // Retorna lista de relatorios
      return await new ResponseGeneric<Relatorio>(relatorio)
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar o Relatorio. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  // Find All de relatorios sem paginação para report
  async findAllForReport(userToken: IdDto, parameter: string, idPublicRegistro: string, idPublicEmpresa: string, idPublicOrgao: string, idPublicSetor: string, dataInicio: Date, dataFim: Date) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'
      // Busca usuario logado
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
        responsavel: {
          nome: ILike(parameter)
        },
        status: {
          descricao: Not(In([statusRegistroEnum.CANCELADO]))
        },
        dataFim: Between(dataInicio, dataFim)
      }

      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;

      if (isAdmin && (idPublicSetor || idPublicOrgao)) {
        whereUsed.setor = idPublicSetor ? { idPublic: idPublicSetor } : { orgao: { idPublic: idPublicOrgao } };
      } else if (isGestor) {
        whereUsed.setor = { idPublic: usuario.setor.idPublic };
        whereUsed.responsavel = { ativo: true }
      }

      if (idPublicRegistro) whereUsed.tipo_registro = { idPublic: idPublicRegistro };
      if (idPublicEmpresa) whereUsed.responsavel = { empresa: { idPublic: idPublicEmpresa } };

      // Busca relatorios no banco de acordo com os parametros
      const relatorios: Relatorio[] = await this.relatorioRepository.find({
        loadEagerRelations: false,
        select: ['id', 'idPublic', 'projeto', 'idTarefa', 'tarefa', 'tipoTarefa', 'status', 'descricao', 'horas', 'valorTarefa', 'dataInicio', 'dataFim', 'responsavel', 'setor', 'tipo_registro'],
        relations: {
          setor: {
            orgao: true
          },
          responsavel: {
            empresa: true
          },
          status: true,
          tipo_registro: true
        },
        where: whereUsed,
        order: {
          dataFechamento: 'DESC'
        }
      })

      if (!relatorios) {
        throw 'Relatórios não encontrados. '
      }

      let relatorio: GetRelatorioDto = new GetRelatorioDto();

      relatorio.registros = relatorios;

      // Adiciona número total de viagens ao body
      relatorio.totalRegistros = Number(relatorio.registros.length);
      // Adiciona valor 0 para que a soma possa ser efetuada corretamente.
      let totalHoras = Number(0);
      relatorio.totalValor = Number(0);
      // Percorre lista de viagens
      for await (const registro of relatorios) {
        // Dividir a string usando ":" como separador
        let partes = registro.horas.split(':');

        // Extrair horas e minutos
        let horas = parseInt(partes[0]);
        let minutos = parseInt(partes[1]);

        let horasDecimal: number = Number(horas + (minutos / 60));

        // Soma valor de viagem no relatorio
        totalHoras += horasDecimal;

        const horasInteiras = Math.floor(totalHoras);
        const minutosDecimal = (totalHoras - horasInteiras) * 60;
        const minutosInteiros = Math.round(minutosDecimal);

        const horasFormatadas = horasInteiras.toString().padStart(2, '0');
        const minutosFormatados = minutosInteiros.toString().padStart(2, '0');

        const tempoFormatado = `${horasFormatadas}:${minutosFormatados}`;

        // Adiciona total de horas
        relatorio.totalHoras = tempoFormatado || '0:00';
        // Soma as distâncias ao relatorio
        relatorio.totalValor += Number(Number(registro.valorTarefa).toFixed(2));
      }

      // Retorna lista de relatorio
      return new ResponseGeneric<GetRelatorioDto>(relatorio);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: "Não foi possível listar Relatórios. ", code: error?.code, erro: error }, HttpStatus.BAD_REQUEST)
    }
  }

  async update(idPublic: string, body: UpdateRelatorioDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um relatorio com o idPublic informado
      const relatorioOriginal: Relatorio = await this.relatorioRepository.findOneBy({
        idPublic,
        ativo: true
      })

      // Verifica se foi encontrado algum relatorio
      if (!relatorioOriginal) {
        // Retorna mensagem de erro
        throw 'Não foi possível encontrar o Relatorio com esta identificação: ' + idPublic
      }

      // Salva no corpo id do relatorio encontrado
      body.id = relatorioOriginal.id;
      // Salva no corpo idPublic do relatorio encontrado
      body.idPublic = relatorioOriginal.idPublic;
      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3))

      // Atualiza no banco dados do relatorio com o id igual ao contido no body
      await queryRunner.manager.save(Relatorio, body);

      // Busca no banco um relatorio com o idPublic informado
      const relatorio: Relatorio = await queryRunner.manager.findOneBy(Relatorio, { idPublic: idPublic })

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna relatorio modificado
      return new ResponseGeneric<Relatorio>(relatorio);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Relatorio. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async remove(idPublic: string, userToken: any) {
    try {
      // Busca no banco um relatorio com o idPublic informado
      const relatorioReturn: Relatorio = await this.relatorioRepository.findOne({
        where: {
          idPublic,
          ativo: true
        },
        select: ['id', 'idPublic', 'ativo'],
        relations: {
          setor: true,
          perfil: true
        }
      })

      // Verifica se foi encontrado algum relatorio
      if (!relatorioReturn) {
        // Retorna mensagem de erro
        throw 'Não foi possível encontrar o Relatorio com esta identificação: ' + idPublic
      }

      // Verifica se usuário não está tentando excluir o relatorio de outro orgão ou setor
      if (relatorioReturn.setor.id != userToken.setor.id) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para excluir relatorio de outro orgão ou setor. ';
      }

      const returnDelete = await this.relatorioRepository.delete({
        idPublic: relatorioReturn.idPublic
      }).catch(async err => {
        // Verifica se o erro retornado é de existência de tabelas relacionadas
        if (err?.code == '23503') {
          // Inativa o relatorio
          await this.dataSource.manager.update(Relatorio, { idPublic }, { ativo: false });
          // Realiza a o softDelete
          return await this.relatorioRepository.softDelete({ idPublic: relatorioReturn.idPublic })
        }
      })

      // Returna mensagem de sucesso
      return new ResponseGeneric<Relatorio>(null, returnDelete.affected + ' Relatorio deletado com sucesso.');
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Relatorio. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }
}
