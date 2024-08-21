import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Relatorio } from '../../relatorio/entities/relatorio.entity';
import { RelatorioService } from '../../relatorio/services/relatorio.service';
import { UsuarioService } from 'src/usuarios/service/usuarios.service';


@Injectable()
export class TasksImportService {
  constructor(
    @InjectRepository(Relatorio, 'second') private readonly repositoryRelatorioRedmine: Repository<Relatorio>,
    private dataSource: DataSource,
    private relatorioService: RelatorioService,
    private usuarioService: UsuarioService,
    @InjectRepository(Relatorio, 'third') private readonly repositoryRelatorioOtrs: Repository<Relatorio>,
  ) { }
  private readonly logger = new Logger(TasksImportService.name);
  private success: boolean = true;

  // Job para create automático de usuários diariamente à meia noite
  // @Cron("20 15 * * *", {
    @Cron(CronExpression.EVERY_10_MINUTES, {
      name: 'FindUsersOtrs',
      timeZone: 'America/Fortaleza'
    })
    async findUsersFromOtrs() {
      // Importa executor de consultas
      const queryRunner = this.dataSource.createQueryRunner();
  
      // Inicia conexão com o banco
      await queryRunner.connect();
  
      // Inicia Transaction
      await queryRunner.startTransaction();
  
      let success = false;
      try {
        // Envia mensagem de início
        this.logger.debug('Start! Called job findAll Usuários OTRS every day of midnight.');
  
        // Cria constante de data atual
        const dateLocal: Date = new Date(new Date().setHours(new Date().getHours() - 3));
  
        dateLocal.setDate(dateLocal.getDate());
  
        // const date = '2000-12-01';
        const date = dateLocal.toISOString().split('T')[0];
  
        const queryUsersOtrs = `
            select 
            u.id as id,
            u.pw as senha,
            u.valid_id as ativo,
            '' as cpf,
            u.first_name as nome,
            u.last_name as sobrenome,
            CONVERT(up.preferences_value USING utf8) as email,
            '' AS setor,
            160 AS jornada, 
            0 AS salario,
            3 as perfil
            from users u
            left join user_preferences up on up.user_id = u.id AND up.preferences_key = 'UserEmail'
            where u.change_time >= ?;
            `;
  
        if (!queryUsersOtrs) {
          throw 'Query usuários OTRS não realizada';
        }
  
        const relatorioOtrs = await this.repositoryRelatorioOtrs.query(queryUsersOtrs, [date]);
  
        // Recebe dados do banco OTRS e salva no sig
        const relatorio = await this.usuarioService.createAllUsers(relatorioOtrs);
  
        // Verifica se relatorio veio vazio
        if (!relatorio) {
          throw 'Relatório do ORTS não pôde ser salvo na base de dados. '
        }
  
        // Atualiza valor do booleano de sucesso para true
        this.success = true;
  
        // Salva Transaction
        await queryRunner.commitTransaction();
  
        // Envia mensagem de sucesso
        this.logger.debug('Success! Called job create Usuários OTRS every day of midnight.');
        this.findUsersFromRedmine()
      } catch (error) {
        // Atualiza valor do booleano de sucesso para false
        this.success = false;
  
        // Retorna dados da transaction
        await queryRunner.rollbackTransaction();
        // Retorna mensagem de erro
        throw new HttpException({ message: 'Não foi possível buscar dados do OTRS. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
      } finally {
        // Libera conexão com o banco
        await queryRunner.release();
      }
    }

  // Job para create automático de usuários diariamente à meia noite
  // @Cron("50 09 * * *", {
  // @Cron(CronExpression.EVERY_10_MINUTES, {
  //   name: 'FindUsersRedmine',
  //   timeZone: 'America/Fortaleza'
  // })
  async findUsersFromRedmine() {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Envia mensagem de início
      this.logger.debug('Start! Called job findAll Usuários Redmine every day of midnight.');

      // Cria constante de data atual
      const dateLocal: Date = new Date(new Date().setHours(new Date().getHours() - 3));

      dateLocal.setDate(dateLocal.getDate());

      // const date = '2000-12-01';
      const date = dateLocal.toISOString().split('T')[0];

      const queryUsersRedmine = `
          select 
          u.id as id, 
          u.hashed_password as senha, 
          u.login as email, 
          u.status as ativo, 
          '' as cpf,
          u.firstname as nome,
          u.lastname as sobrenome,
          cv5.value AS jornada, 
          3 as perfil
          from users u 
          LEFT JOIN custom_values cv5 ON cv5.customized_id = u.id AND cv5.custom_field_id = 5
          where "admin" = false and u.updated_on >= $1;
          `;

      if (!queryUsersRedmine) {
        throw 'Query de usuario Redmine não realizada';
      }

      const usuariosRedmine = await this.repositoryRelatorioRedmine.query(queryUsersRedmine, [date]);

      const queryUsersRedmineAdmin = `
          select 
          u.id as id, 
          u.hashed_password as senha, 
          u.login as email, 
          u.status as ativo, 
          '' as cpf,
          u.firstname as nome,
          u.lastname as sobrenome,
          cv5.value AS jornada, 
          1 as perfil
          from users u 
          LEFT JOIN custom_values cv5 ON cv5.customized_id = u.id AND cv5.custom_field_id = 5
          where "admin" = true and u.updated_on >= $1;
          `;

      if (!queryUsersRedmineAdmin) {
        throw 'Query usuário Redmine não realizada';
      }

      const usuariosRedmineAdmin = await this.repositoryRelatorioRedmine.query(queryUsersRedmineAdmin, [date]);

      // Recebe dados do banco redmine e salva no sig
      const usuarios = await this.usuarioService.createAllUsers(usuariosRedmine);
      const admins = await this.usuarioService.createAllUsers(usuariosRedmineAdmin);

      // Verifica se usuarios veio vazio
      if (!usuarios || !admins) {
        throw 'Usuários não poderam ser salvos na base de dados. '
      }

      // Atualiza valor do booleano de sucesso para true
      this.success = true;

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job create Usuários Redmine every day of midnight.');
      if (this.success) {
        this.findImportsFromRedmine();
        this.findImportsFromOtrs();
      }
    } catch (error) {
      // Atualiza valor do booleano de sucesso para false
      this.success = false;

      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar dados do Redmine. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  // Job para create automático de relatorio diariamente à meia noite
  // @Cron("50 16 * * *", {
  // @Cron(CronExpression.EVERY_10_MINUTES, {
  //   name: 'FindRelatorioRedmine',
  //   timeZone: 'America/Fortaleza'
  // })
  async findImportsFromRedmine() {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Envia mensagem de início
      this.logger.debug('Start! Called job findAll Relatório Redmine every day of midnight.');

      // Cria constante de data atual
      const dateLocal: Date = new Date(new Date().setHours(new Date().getHours() - 3));

      dateLocal.setDate(dateLocal.getDate());

      // const date = '2023-12-01';
      const date = dateLocal.toISOString().split('T')[0];

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
      where i.updated_on >= $1 and is2.id in (5,6) AND t.id NOT IN (15,8,11,7,6,10);
      `;

      if (!queryRedmine) {
        throw 'Query relatório Redmine não realizada';
      }

      const relatorioRedmine = await this.repositoryRelatorioRedmine.query(queryRedmine, [date]);

      // Recebe dados do banco redmine e salva no sig
      const relatorio = await this.relatorioService.createAll(relatorioRedmine);

      // Verifica se relatorio veio vazio
      if (!relatorio) {
        throw 'Relatório não pôde ser salvo na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job create Relatorio Redmine every day of midnight.');
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

  // Job para create automático de relatorio diariamente à meia noite
  // @Cron("48 10 * * *", {
  // @Cron(CronExpression.EVERY_10_MINUTES, {
  //   name: 'FindRelatorioOtrs',
  //   timeZone: 'America/Fortaleza'
  // })
  async findImportsFromOtrs() {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {
      // Envia mensagem de início
      this.logger.debug('Start! Called job findAll Relatório OTRS every day of midnight.');

      // Cria constante de data atual
      const dateLocal: Date = new Date(new Date().setHours(new Date().getHours() - 3));

      dateLocal.setDate(dateLocal.getDate());

      // const date = '2023-12-01';
      const date = dateLocal.toISOString().split('T')[0];

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
      where t.change_time >= ? and t.ticket_state_id in (2,3,7,8,10)
      GROUP by 1,2,3,4,5,6,7,8,9,10,11,12
      `;

      if (!queryOtrs) {
        throw 'Query relatório OTRS não realizada';
      }

      const relatorioOtrs = await this.repositoryRelatorioOtrs.query(queryOtrs, [date]);

      // Recebe dados do banco OTRS e salva no sig
      const relatorio = await this.relatorioService.createAll(relatorioOtrs);

      // Verifica se relatorio veio vazio
      if (!relatorio) {
        throw 'Relatório do ORTS não pôde ser salvo na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job create Relatorio OTRS every day of midnight.');
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
}