import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as ejs from 'ejs';
import { Perfil } from "src/perfil/entities/perfil.entity";
import { PerfilEnum } from 'src/perfil/enums/perfilEnum.enum';
import { Relatorio } from 'src/relatorio/entities/relatorio.entity';
import { Setor } from 'src/setor/entities/setor.entity';
import { CreateCorpoDto } from 'src/utils/email/dto/create-corpo.dto';
import { Payload } from 'src/utils/email/interface/payload.interface';
import { EmailService } from 'src/utils/email/service/email.service';
import { EmailVerifyDto } from 'src/utils/emailVerify.dto';
import { IdDto } from 'src/utils/id.dto';
import { PaginationInterface } from 'src/utils/interface/pagination.interface';
import { PassVerify } from 'src/utils/pass-verify/passVerify';
import { ResponseGeneric } from 'src/utils/response.generic';
import { DataSource, ILike, Repository } from 'typeorm';
import { CreateUsuarioDto } from '../dto/createUsuario.dto';
import { ImportUsuarioDto } from '../dto/import-usuario.dto';
import { UpdatePassRedefinirDto } from '../dto/update-pass-redefinir.dto';
import { UpdatePassDto } from '../dto/update-pass.dto';
import { UpdateUsuarioSelfDto } from '../dto/update-usuario-self.dto';
import { UpdateUsuarioDto } from '../dto/updateUsuario.dto';
import { Usuario } from '../entities/usuario.entity';
import { Auxiliar } from 'src/auxiliar/entities/auxiliar.entity';
import { keyAuxiliarEnum } from 'src/auxiliar/enum/keyAuxiliar.enum';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepository: Repository<Usuario>,
    private dataSource: DataSource,
    private passVerify: PassVerify,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(Relatorio, 'second') private readonly repositoryRelatorioRedmine: Repository<Relatorio>,
    @InjectRepository(Relatorio, 'third') private readonly repositoryRelatorioOtrs: Repository<Relatorio>
  ) { }
  private readonly logger = new Logger(UsuarioService.name);

  async verificaPassword(pass: string) {
    // Verifica se a senha é forte
    if (!(await this.passVerify.passVerify(pass))) {
      throw 'Senha deve ter no mínimo 8 caracteres e conter ao menos 1 número, 1 letra minúscula, 1 letra maiúscula e 1 caractere especial. '
    }

    // Transforma senha informada em hash
    pass = await bcrypt.hash(pass, Number(process.env.BCRYPT_SALT_ROUNDS));

    return pass;
  }

  async create(body: CreateUsuarioDto) {
    try {
      // Recebe dados da função verificaPassword para validar senha
      const pass = await this.verificaPassword(body.senha);

      // Verifica se pass veio vazia
      if (!pass) {
        throw 'Dados para validar senha não retornaram. '
      }

      body.senha = pass;

      // Trata possíveis inconsistências no email
      body.email = body.email.trim().toLowerCase();

      // Retira máscara de cpf
      body.cpf = body.cpf.replace(/[^0-9]/g, "").trim();

      // Busca Perfis do Usuário
      const perfil: Perfil = await this.dataSource.getRepository(Perfil).findOneBy({ id: body.perfil.id });

      // Verifica se o perfil existe
      if (!perfil) {
        throw 'Perfil não encontrado. '
      }

      const setor: Setor = await this.dataSource.getRepository(Setor).findOneBy({ id: body.setor.id });

      // Verifica se o setor existe
      if (!setor) {
        // Retorna mensagem de erro
        throw 'Setor não encontrado. '
      }

      const empresa: Auxiliar = await this.dataSource.getRepository(Auxiliar).findOneBy({ id: body.empresa.id });

      // Verifica se o empresa existe
      if (!empresa) {
        // Retorna mensagem de erro
        throw 'Empresa não encontrada. '
      }

      // Adiciona o valor true a redefinirPass para que o usuário possa redefinir a sua senha no primeiro login
      body.redefinirPass = true;

      // Salva novo usuário no banco
      const usuario = await this.usuarioRepository.save(body)

      // Busca no banco usuário salvo
      const usuarioReturn: Usuario = await this.usuarioRepository.findOneBy({ id: usuario.id });

      // Prepara payload do token
      const payload = { email: body.email, idPublic: usuarioReturn.idPublic };

      // Gera um token com o payload, chave secreta e tempo de expiração pre-definido
      const token = await this.jwtService.sign(payload, {
        secret: process.env.SECRET_KEY_EMAIL,
        expiresIn: process.env.EMAIL_EXPIRATION_TIME
      });

      // Verifica se a aplicação está rodando em ambiente DEV ou PROD
      if (process.env.NODE_ENV == 'DEV') {
        var url = `http://localhost:4200/autenticacao/reset/`
      } else {
        url = `${process.env.URL_APP}/autenticacao/reset/`
      }

      // Cria body de email para create de corpo
      const bodyEmail: CreateCorpoDto = new CreateCorpoDto();

      // Adiciona dados ao body email
      bodyEmail.nome = usuarioReturn.nome;
      // Adiciona dados ao body email
      bodyEmail.email = usuarioReturn.email;
      // Adiciona link com token
      bodyEmail.link = url + token

      // Prepara corpo do e-mail a ser enviado
      const corpoEmail: string = await ejs.renderFile('./src/utils/email/templates/template-novousuario.ejs', { data: bodyEmail })

      // Envia e-mail ao usuário informando o link e código para redefinição de senha
      await this.emailService.sendMail({
        destinatarios: [usuarioReturn.email],
        assunto: 'Redefinição de Senha do Novo Usuário de ' + process.env.APPLICATION_NAME,
        corpo: corpoEmail
      })

      // Retorna dados do usuário cadastrado
      return new ResponseGeneric<Usuario>(usuarioReturn);
    } catch (error) {
      console.error(error);
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível cadastrar Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async createAllUsers(body: ImportUsuarioDto[]) {
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

      // Captura as importações dos usuarios em um array de objeto json
      const importado = body;

      const usuarios: CreateUsuarioDto[] = [];

      // Mapeia parse para tratativa dos dados
      for await (let data of importado) {
        // Chama função que busca os dados do csv
        let usuario: any = new CreateUsuarioDto();

        let emailImport = data.email ? data.email.trim() : data.nome.trim().toLocaleLowerCase().normalize("NFD").replace(/\s+/g, '.').replace(/[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g, "").replace(/ç/g, 'c') + '@sig.com.br';

        const usuarioCheck: Usuario = await this.usuarioRepository.findOneBy({
          email: ILike('%' + emailImport + '%')
        });

        let empresaImport = data.empresa ? data.empresa.trim() : 'PUBLICA';
        const empresa: any = await this.dataSource.getRepository(Auxiliar).findOneBy({
          descricao: ILike('%' + empresaImport + '%'),
          chave: keyAuxiliarEnum.EMPRESA
        });
        // Verifica se o setor existe
        if (!empresa) {
          // Retorna mensagem de erro
          erros.push(" Empresa não encontrada. Identificação: " + (empresaImport) + ".<br>");
        }

        let setorImport = data.setor ? data.setor.trim() : 'Infraestrutura';
        const setor: Setor = await this.dataSource.getRepository(Setor).findOneBy({
          nome: ILike('%' + setorImport + '%')
        });
        // Verifica se o setor existe
        if (!setor) {
          // Retorna mensagem de erro
          erros.push(" Setor ou Órgão não encontrado. Identificação: " + (setorImport) + ".<br>");
        }

        // Verifica se not nulls e uniques estão vindo com string vazia
        let nome = data.nome.trim();
        let sobrenome = data.sobrenome.trim();
        let cpf = data.cpf == '' ? null : data.cpf.replace(/[^0-9]/g, "").trim();
        let senha = data.senha == '' ? null : data.senha;
        let perfil = data.perfil == 0 ? 3 : data.perfil;

        if (usuarioCheck) {
          // Adiciona ids aos dados do usuarioCheck
          usuario.id = usuarioCheck.id;
          usuario.idPublic = usuarioCheck.idPublic;

          // Adiciona empresa ao usuário
          usuario.empresa = empresa;

          // Adiciona setor ao usuário
          usuario.setor = setor;

          // Adiciona responsavel ao usuario
          usuario.nome = nome + ' ' + sobrenome;
          usuario.email = emailImport;

          // Adiciona dados ao usuario
          usuario.cpf = cpf;

          // inicializa jornada e salario
          if (data.jornada) {
            let jornada = 0;
            jornada = Number(data.jornada);
            usuario.jornada = jornada;
          }

          if (data.salario) {
            let salario = 0;
            salario = Number(data.salario);
            usuario.salario = salario;
          }

        } else {
          // Adiciona empresa ao relatório
          usuario.empresa = empresa;

          // Adiciona setor ao usuário
          usuario.setor = setor;

          // Adiciona responsavel ao usuario
          usuario.nome = nome + ' ' + sobrenome;
          usuario.email = emailImport;

          // Adiciona dados ao usuario
          usuario.cpf = cpf;
          usuario.senha = senha;
          usuario.perfil = perfil;
          
          // inicializa jornada e salario
          if (data.jornada) {
            let jornada = 0;
            jornada = Number(data.jornada);
            usuario.jornada = jornada;
          }

          if (data.salario) {
            let salario = 0;
            salario = Number(data.salario);
            usuario.salario = salario;
          }

        }

        usuarios.push(usuario);

        // Retorna erros encontrados, se houverem mais de 10 erros
        if (erros.length > 10) {
          throw erros;
        }
      }
      // Retorna erros encontrados, se houverem erros
      if (erros.length > 0) {
        throw erros;
      }

      const usuarioSave = await queryRunner.manager.save(Usuario, usuarios);

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Altera parametro de sucesso
      success = true;

      // Retorna dados do usuário cadastrado
      return new ResponseGeneric<Usuario[]>(usuarioSave);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();
      // Altera parametro de sucesso
      success = false;
      console.error(error);
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível cadastrar o usuario. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async findUsersFromRedmine(dataInicio: Date, dataFim: Date) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {

      // Envia mensagem de início
      this.logger.debug('Start! Called job findAll Usuarios Redmine every day of midnight.');

      let inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().setHours(new Date().getHours() - 3));
      inicio.setHours(0, 0, 0, 0);

      let fim = dataFim ? new Date(dataFim) : new Date(new Date().setHours(new Date().getHours() - 3));
      fim.setHours(23, 59, 59, 999);


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
          where "admin" = false and u.updated_on between $1 and $2;
          `;

      if (!queryUsersRedmine) {
        throw 'Query de usuario Redmine não realizada';
      }

      const usuariosRedmine = await this.repositoryRelatorioRedmine.query(queryUsersRedmine, [inicio, fim]);

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
          where "admin" = true and u.updated_on between $1 and $2;
          `;

      if (!queryUsersRedmineAdmin) {
        throw 'Query de usuario Redmine não realizada';
      }

      const usuariosRedmineAdmin = await this.repositoryRelatorioRedmine.query(queryUsersRedmineAdmin, [inicio, fim]);

      // Recebe dados do banco redmine e salva no sig
      const admins = await this.createAllUsers(usuariosRedmineAdmin);
      const usuarios = await this.createAllUsers(usuariosRedmine);

      // Verifica se usuarios veio vazio
      if (!usuarios || !admins) {
        throw 'Usuários do Redmine não foram salvos na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job create Usuarios Redmine every day of midnight.');

      return new ResponseGeneric<Usuario[]>(usuariosRedmineAdmin, usuariosRedmine);
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

  async findUsersFromOtrs(dataInicio: Date, dataFim: Date) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();
    try {

      // Envia mensagem de início
      this.logger.debug('Start! Called job findAll Users OTRS every day of midnight.');

      // Cria constante de data atual
      let inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().setHours(new Date().getHours() - 3));
      inicio.setHours(0, 0, 0, 0);

      let fim = dataFim ? new Date(dataFim) : new Date(new Date().setHours(new Date().getHours() - 3));
      fim.setHours(23, 59, 59, 999);

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
          where u.change_time between ? and ?;
          `;

      if (!queryUsersOtrs) {
        throw 'Query não realizada';
      }

      const usuariosOtrs = await this.repositoryRelatorioOtrs.query(queryUsersOtrs, [inicio, fim]);

      // Recebe dados do banco OTRS e salva no sig
      const usuario = await this.createAllUsers(usuariosOtrs);

      // Verifica se usuario veio vazio
      if (!usuario) {
        throw 'Usuários do ORTS não foram salvo na base de dados. '
      }

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Envia mensagem de sucesso
      this.logger.debug('Success! Called job create Users OTRS every day of midnight.');

      return new ResponseGeneric<Usuario[]>(usuariosOtrs);

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

  async findByEmail(email: string) {
    return await this.usuarioRepository.findOne({ where: { email } });
  }

  async findAllAdmin(parameter: string, page: number, size: number) {
    try {
      // Adiciona chaves para pesquisa sql ilike
      parameter = '%' + parameter + '%'

      const whereUsed: any[] = [
        {
          cpf: ILike(parameter),
        },
        {
          nome: ILike(parameter),
        },
        {
          email: ILike(parameter),
        }
      ];

      // Busca no banco todos os usuários cadastrados que sejam do perfil 'ADMIN'
      const [usuarios, total]: [Usuario[], number] = await this.usuarioRepository.findAndCount({
        loadEagerRelations: false,
        withDeleted: true,
        relations: {
          setor: {
            orgao: true
          },
          perfil: {
            permission: true
          }
        },
        where: whereUsed,
        order: {
          nome: 'ASC'
        },
        take: size,
        skip: size * page
      })


      // Retorna a lista de usuários
      return new ResponseGeneric<PaginationInterface<Usuario[]>>({
        content: usuarios,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Usuários.', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findAllGestor(userToken: IdDto, idPublicSetor: string, idPublicOrgao: string, parameter: string, page: number, size: number) {
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

      let whereUsed: any = [];

      if (parameter != (null || undefined || '')) {

        whereUsed = [
          {
            nome: ILike('%' + parameter + '%'),
          },
          {
            email: ILike('%' + parameter + '%')
          }
        ]
      }

      // Verifica as condições da pesquisa e complementa
      const isAdmin = usuario.perfil.nome == PerfilEnum.Admin;
      const isGestor = usuario.perfil.nome == PerfilEnum.Gestor;


      // Verifica as condições da pesquisa e complementa
      if (isAdmin) {

        if (idPublicOrgao != '') whereUsed.setor.orgao = { idPublic: idPublicOrgao };
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


      // Busca no banco todos os usuários cadastrados que sejam do perfil 'ADMIN'
      const [usuarios, total]: [Usuario[], number] = await this.usuarioRepository.findAndCount({
        loadEagerRelations: false,
        withDeleted: false,
        relations: {
          setor: true,
          perfil: true
        },
        where: whereUsed,
        order: {
          nome: 'ASC'
        },
        take: size,
        skip: size * page
      })


      // Retorna a lista de usuários
      return new ResponseGeneric<PaginationInterface<Usuario[]>>({
        content: usuarios,
        total: total,
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível listar Usuários.', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findOneGestor(idPublic: string) {
    try {
      // Busca no banco um usuário com o idPublic informado
      const usuario: Usuario = await this.usuarioRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        relations: {
          setor: {
            orgao: true
          },
          perfil: {
            permission: true
          }
        },
        where: {
          idPublic,
          perfil: {
            nome: PerfilEnum.Gestor
          }
        }
      });

      // Verifica se foi encontrado algum usuário
      if (!usuario) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Retorna usuário encontrado
      return await new ResponseGeneric<Usuario>(usuario);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar o Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async findOne(idPublic: string) {
    try {
      // Busca no banco um usuário com o idPublic informado
      const usuario: Usuario = await this.usuarioRepository.findOne({
        select: ['updatedAt', 'id', 'idPublic', 'nome', 'email', 'cpf', 'jornada', 'salario', 'ativo', 'redefinirPass', 'lastAccess', 'firstAccess', 'dataDelete'],
        withDeleted: false,
        relations: {
          setor: {
            orgao: true
          },
        },
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado algum usuário
      if (!usuario) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      usuario.salario = Number(usuario.salario)

      // Retorna usuário encontrado
      return await new ResponseGeneric<Usuario>(usuario);
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível buscar o Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async update(idPublic: string, body: UpdateUsuarioDto, userToken: IdDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um usuário com o idPublic informado
      const usuarioCheck: Usuario = await this.usuarioRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        select: ['id', 'idPublic'],
        relations: {
          perfil: true
        },
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado um usuário
      if (!usuarioCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Verifica se usuário não está tentando alterar o próprio perfil
      if (usuarioCheck.id == userToken.id && !PerfilEnum.Admin) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para modificar o próprio usuário.';
      }

      if (body.salario) {
        let salario = 0;
        salario = Number(body.salario);
        usuarioCheck.salario = salario;
      }

      if (body.cpf) {
        usuarioCheck.cpf = body.cpf.replace(/[^0-9]/g, "").trim();
      }

      // Salva no corpo data e hora atual 
      body.updatedAt = new Date(new Date().setHours(new Date().getHours() - 3));

      // Adiciona id do usuario em questão no corpo do update
      const bodyUpdate: Usuario = { ...usuarioCheck, ...body };

      // Atualiza dados do usuário com o idPublic informado
      await queryRunner.manager.save(Usuario, bodyUpdate)

      // Busca no banco um usuário com o idPublic informado
      const usuario: Usuario = await queryRunner.manager.findOneBy(Usuario, { idPublic });

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna usuário modificado
      return new ResponseGeneric<Usuario>(usuario);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async updateGestor(idPublic: string, body: UpdateUsuarioDto, userToken: IdDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um usuário com o idPublic informado
      const usuarioCheck: Usuario = await this.usuarioRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        select: ['id', 'idPublic'],
        relations: {
          perfil: true
        },
        where: {
          idPublic,
          perfil: {
            nome: PerfilEnum.Gestor
          }
        }
      });

      // Verifica se foi encontrado um usuário
      if (!usuarioCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Verifica se usuário não está tentando alterar o próprio perfil
      if (usuarioCheck.id == userToken.id && !PerfilEnum.Admin) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para modificar o próprio usuário.';
      }

      // Adiciona id do usuario em questão no corpo do update
      const bodyUpdate: Usuario = { ...usuarioCheck, ...body };

      // Atualiza dados do usuário com o idPublic informado
      await queryRunner.manager.save(Usuario, bodyUpdate)

      // Busca no banco um usuário com o idPublic informado
      const usuario: Usuario = await queryRunner.manager.findOneBy(Usuario, { idPublic });

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna usuário modificado
      return new ResponseGeneric<Usuario>(usuario);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Usuário. ', code: error?.code, erro: error }, HttpStatus.BAD_REQUEST)
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async updateSelf(idPublic: string, body: UpdateUsuarioSelfDto, userToken: IdDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um usuário com o idPublic informado
      const usuarioCheck: Usuario = await this.usuarioRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        select: ['id', 'idPublic'],
        relations: {
          perfil: true
        },
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado um usuário
      if (!usuarioCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Verifica se o id em questão é o mesmo do usuário logado
      if (usuarioCheck.id != userToken.id) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para modificar outros usuários.';
      }

      // Retira máscara de cpf
      body.cpf = body.cpf.replace(/[^0-9]/g, "").trim();

      // Adiciona id do usuario em questão no corpo do update
      const bodyUpdate: Usuario = { ...usuarioCheck, ...body };


      // Atualiza dados do usuário com o idPublic informado
      await queryRunner.manager.save(Usuario, bodyUpdate)

      // Busca no banco um usuário com o idPublic informado
      const usuario: Usuario = await queryRunner.manager.findOneBy(Usuario, { idPublic });

      // Atualiza senha do usuario com o idPublic informado
      await queryRunner.manager.update(Usuario, { idPublic }, { cpf: body.cpf })

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna usuário modificado
      return new ResponseGeneric<Usuario>(usuario);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar o Usuário. ', code: error?.code, erro: error }, HttpStatus.BAD_REQUEST)
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  async updatePass(idPublic: string, body: UpdatePassDto, userToken: IdDto) {
    // Importa executor de consultas
    const queryRunner = this.dataSource.createQueryRunner();

    // Inicia conexão com o banco
    await queryRunner.connect();

    // Inicia Transaction
    await queryRunner.startTransaction();

    try {
      // Busca no banco um usuário com o idPublic informado
      const usuarioCheck: Usuario = await this.usuarioRepository.findOne({
        loadEagerRelations: false,
        withDeleted: false,
        select: ['id', 'senha', 'email'],
        where: {
          idPublic
        }
      });

      // Verifica se foi encontrado um usuário
      if (!usuarioCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Compara a senha informada com a senha do banco
      const compare = await bcrypt.compare(body.senha, usuarioCheck.senha);

      // Verifica se a comparação foi aprovada
      if (!compare) {
        // Retorna mensagem de erro
        throw "Senha informada incorreta."
      }

      // Recebe dados da função verificaPassword para validar senha
      const pass = await this.verificaPassword(body.novaSenha);

      // Verifica se pass veio vazia
      if (!pass) {
        throw 'Dados para validar senha não retornaram. '
      }

      // Atualiza dados do usuário com o idPublic informado
      await queryRunner.manager.update(Usuario, { idPublic }, { senha: pass, redefinirPass: false });

      // Salva Transaction
      await queryRunner.commitTransaction();

      // Retorna usuário modificado
      return await new ResponseGeneric<Usuario>(usuarioCheck);
    } catch (error) {
      // Retorna dados da transaction
      await queryRunner.rollbackTransaction();

      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar a senha do Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    } finally {
      // Libera conexão com o banco
      await queryRunner.release();
    }
  }

  // Gera e envia link para redefinição de senha
  async restorePass(body: EmailVerifyDto) {
    try {
      // Busca no banco um usuário com o e-mail informado
      const usuarioCheck: Usuario = await this.usuarioRepository.findOne({
        withDeleted: false,
        select: ['id', 'idPublic', 'nome', 'email', 'cpf', 'ativo', 'redefinirPass', 'firstAccess', 'lastAccess', 'perfil', 'createdAt', 'updatedAt'],
        where: {
          email: body.email
        }
      });

      // Verifica se foi encontrado algum usuário
      if (!usuarioCheck) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com o e-mail informado. ';
      }

      // Verifica se o usuário está inativo
      if (!usuarioCheck.ativo) {
        // Retorna mensagem de erro
        throw 'Sua conta de usuário está inativa. Para recuperar sua senha entre em contato com um administrador.'
      }

      // Prepara payload do token
      const payload = { email: body.email, idPublic: usuarioCheck.idPublic };

      // Gera um token com o payload, chave secreta e tempo de expiração pre-definido
      const token = await this.jwtService.sign(payload, {
        secret: process.env.SECRET_KEY_EMAIL,
        expiresIn: process.env.EMAIL_EXPIRATION_TIME
      });

      // Verifica se a aplicação está rodando em ambiente DEV ou PROD
      if (process.env.NODE_ENV == 'DEV') {
        var url = `http://localhost:4200/autenticacao/reset/`
      } else {
        url = `${process.env.URL_APP}/autenticacao/reset/`
      }

      // Cria body de email para create de corpo
      const bodyEmail: CreateCorpoDto = new CreateCorpoDto();

      // Adiciona dados ao body email
      bodyEmail.nome = usuarioCheck.nome;
      // Adiciona link com token
      bodyEmail.link = url + token

      // Prepara corpo do e-mail a ser enviado
      const corpoEmail: string = await ejs.renderFile('./src/utils/email/templates/template-recupera-senha.ejs', { data: bodyEmail })

      // Envia e-mail ao usuário informando o link e código para redefinição de senha
      await this.emailService.sendMail({
        destinatarios: [usuarioCheck.email],
        assunto: 'Redefinição de Senha do Usuário de ' + process.env.APPLICATION_NAME,
        corpo: corpoEmail
      })

      // Pega posição do @ no e-mail do usuário
      var endReplace = usuarioCheck.email.indexOf("@");
      // Divide a posição do @ por 2
      var initReplace = endReplace / 2;
      // Verifica se a posição do @ é maior que 3 
      if (endReplace > 3) {
        // Define posição inicial do replace
        initReplace = 3;
      }
      // Transforma parte do email do usuário em ***
      const email = usuarioCheck.email.replace(usuarioCheck.email.substring(initReplace, endReplace), "*****")
      // Retorna mensagem de sucesso
      return await new ResponseGeneric(null, "Um link para redefinição de senha foi enviado para o email: " + email + ". Verifique sua caixa de entrada ou spam.");
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível redefinir a senha do Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async resetPass(payload: Payload, body: UpdatePassRedefinirDto) {
    try {
      // Busca no banco um usuário com os dados do payload informado
      const usuario: Usuario = await this.usuarioRepository.findOne({
        withDeleted: false,
        where: {
          email: payload.email,
          idPublic: payload.idPublic
        },
        select: ['id', 'ativo', 'idPublic', 'email', 'cpf', 'senha', 'ativo']
      })

      // Verifica se foi encontrado algum usuario
      if (!usuario) {
        // Retorna mensagem de erro
        throw 'Usuário não encontrado. '
      }

      // Verifica se o usuário está inativo
      if (!usuario.ativo) {
        // Retorna mensagem de erro
        throw 'Sua conta de usuário está inativa. Para recuperar sua senha entre em contato com um administrador.'
      }

      // Recebe dados da função verificaPassword para validar senha
      const pass = await this.verificaPassword(body.novaSenha);

      // Verifica se pass veio vazia
      if (!pass) {
        // Retorna mensagem de erro
        throw 'Dados para validar senha não retornaram. '
      }

      // Compara a senha informada com a confirmação de senha
      const compare = await bcrypt.compare(body.confirmacaoSenha, pass);

      // Verifica se a comparação foi aprovada
      if (!compare) {
        // Retorna mensagem de erro
        throw "Senhas informadas estão diferentes."
      }

      // Atualiza senha do usuário com o idPublic pelo hash da nova senha informada
      await this.usuarioRepository.update({ idPublic: usuario.idPublic }, { senha: pass, redefinirPass: false });

      // Returna mensagem de sucesso
      return await new ResponseGeneric<Usuario>(null, 'Senha atualizada com sucesso. ');
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível modificar a senha do Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND);
    }
  }

  async remove(idPublic: string, userToken: IdDto) {
    try {
      // Busca no banco um usuário com o idPublic informado
      const usuarioReturn: Usuario = await this.usuarioRepository.findOne({
        withDeleted: false,
        where: {
          idPublic
        },
        select: ['id', 'idPublic', 'email', 'ativo'],
        relations: {
          perfil: true
        }
      })

      // Verifica se foi encontrado algum usuário
      if (!usuarioReturn) {
        // Retorna mensagem de erro
        throw 'Não foi encontrado Usuário com esta identificação: ' + idPublic;
      }

      // Verifica se usuário não está tentando excluir o próprio perfil
      if (usuarioReturn.id == userToken.id) {
        // Retorna mensagem de erro
        throw 'Usuário sem autorização para excluir o próprio usuário.';
      }

      // Verifica se usuário não está tentando excluir o usuário Admin
      if (usuarioReturn.email == process.env.EMAIL_ADMIN) {
        // Retorna mensagem de erro
        throw 'Usuário Admin não pode ser excluído.';
      }

      // Deleta o usuário com o idPublic informado
      const returnDelete = await this.usuarioRepository.delete({ idPublic: usuarioReturn.idPublic }).catch(async err => {
        // Verifica se o erro retornado é de existência de tabelas relacionadas
        if (err?.code == '23503') {
          // Inativa o usuário
          await this.dataSource.manager.update(Usuario, { idPublic }, { ativo: false });
          // Realiza a o softDelete
          return await this.usuarioRepository.softDelete({ idPublic: usuarioReturn.idPublic })
        }
      });

      // Returna mensagem de sucesso
      return new ResponseGeneric<Usuario>(null, returnDelete.affected + ' Usuário deletado com sucesso.');
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível deletar o Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }

  async recuperar(parameter: string) {
    try {
      // Busca no banco um usuário com o parametro informado
      const usuario: Usuario = await this.usuarioRepository.findOne({
        where: [
          {
            cpf: ILike('%' + parameter + '%')
          },
          {
            email: ILike('%' + parameter + '%')
          }
        ],
        withDeleted: true
      })
      // Verifica se foi encontrado algum usuario
      if (!usuario) {
        // Retorna mensagem de erro
        throw 'Usuário não encontrado.'
      }
      // Recupera usuário deletado
      const usuarioRecover = await this.usuarioRepository.restore({ id: usuario.id });
      // Reativa usuario e pede para que seja redefinida a senha
      await this.usuarioRepository.update({ id: usuario.id }, { ativo: true, redefinirPass: true });
      // Envia e-mail para recuperar senha
      await this.restorePass({ email: usuario.email });
      // Returna mensagem de sucesso
      return new ResponseGeneric<Usuario>(null, usuarioRecover.affected + ' Usuário restaurado com sucesso.');
    } catch (error) {
      // Retorna mensagem de erro
      throw new HttpException({ message: 'Não foi possível restaurar o Usuário. ', code: error?.code, erro: error }, HttpStatus.NOT_FOUND)
    }
  }
}
