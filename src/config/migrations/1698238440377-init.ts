import { MigrationInterface, QueryRunner } from "typeorm"
import * as bcrypt from 'bcrypt';
import { PerfilEnum } from "src/perfil/enums/perfilEnum.enum";
import UsuarioPermission from "src/usuarios/enums/usuarioPermission.enum";
import PerfilPermission from "src/perfil/enums/perfilPermission.enum";
import PermissionsPermission from "src/permission/enums/permissionsPermission.enum";
import SetorPermission from "src/setor/enum/setorPermission.enum";
import OrgaoPermission from "src/orgao/enum/orgaoPermission.enum";
import DashboardPermission from "src/dashboard/enum/dashboardPermission.enum";
import RelatoriodPermission from "src/relatorio/enum/relatorioPermission.enum";
import AuxiliarPermission from "src/auxiliar/enum/auxiliarPermission.enum";
import { statusRegistroEnum } from "src/auxiliar/enum/statusRegistro.enum";
import { keyAuxiliarEnum } from "src/auxiliar/enum/keyAuxiliar.enum";
import { tipoRegistroEnum } from "src/auxiliar/enum/tipoRegistro.enum";
import { tipoEmpresaEnum } from "src/auxiliar/enum/tipoEmpresa.enum";

export class Init1698238440377 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        /** --------------
        @PERFIL
        -------------- */
        // INSERÇÃO DE PERFIS NA TABELA PERFIL
        await queryRunner.query(`
        INSERT INTO security.perfil (nome, ativo) VALUES
            ('${PerfilEnum.Admin}', 'true'),
            ('${PerfilEnum.Gestor}', 'true'),
            ('${PerfilEnum.Usuario}', 'true')
		`)

        /** --------------
        @PERMISSOES
        -------------- */
        // INSERÇÃO DE PERMISSÕES NA TABELA PERMISSOES
        await queryRunner.query(`
        INSERT INTO security.permission (nome, descricao) VALUES
            ('${UsuarioPermission.LER_USUARIO}', 'Permite visualizar todos usuários registrados.'),
            ('${UsuarioPermission.LER_USUARIO_GESTOR}', 'Permite visualizar todos usuários gestores registrados.'),
            ('${UsuarioPermission.MODIFICAR_USUARIO}', 'Permite editar, adicionar e excluir outros usuários registrados.'),
            ('${UsuarioPermission.MODIFICAR_USUARIO_GESTOR}', 'Permite editar, adicionar e excluir apenas usuários gestores registrados.'),
            ('${UsuarioPermission.MODIFICAR_USUARIO_PUBLIC}', 'Permite editar o próprio usuário registrado.'),
            ('${PerfilPermission.LER_PERFIL}', 'Permite visualizar perfis registrados.'),
            ('${PerfilPermission.MODIFICAR_PERFIL}', 'Permite editar, adicionar e excluir perfis registrados.'),
            ('${PermissionsPermission.LER_PERMISSIONS}', 'Permite visualizar permissões registradas.'),
            ('${PermissionsPermission.MODIFICAR_PERMISSIONS}', 'Permite editar, adicionar e excluir permissões registradas.'),
            ('${SetorPermission.LER_SETOR}', 'Permite visualizar setores registrados.'),
            ('${SetorPermission.MODIFICAR_SETOR}', 'Permite editar, adicionar e excluir setores registrados.'),
            ('${OrgaoPermission.LER_ORGAO}', 'Permite visualizar órgãos registrados.'),
            ('${OrgaoPermission.MODIFICAR_ORGAO}', 'Permite editar, adicionar e excluir órgãos registrados.'),
            ('${DashboardPermission.LER_DASHBOARD}', 'Permite visualizar dashboard.'),
            ('${DashboardPermission.LER_DASHBOARD_USUARIO}', 'Permite usuário visualizar dashboard.'),
            ('${DashboardPermission.MODIFICAR_DASHBOARD}', 'Permite editar, adicionar e excluir dashboards registrados.'),
            ('${AuxiliarPermission.LER_AUXILIAR}', 'Permite visualizar dados auxiliares registrados.'),
			('${AuxiliarPermission.MODIFICAR_AUXILIAR}', 'Permite editar, adicionar e excluir dados auxiliares registrados.'),
            ('${RelatoriodPermission.LER_RELATORIO}', 'Permite visualizar relatórios registrados.'),
            ('${RelatoriodPermission.MODIFICAR_RELATORIO}', 'Permite editar, adicionar e excluir relatórios registrados.')
        `)


        /** --------------
        @PERFIL_PERMISSOES Admin
        -------------- */
        // INSERÇÃO DE PERMISSOES NO PERFIL Admin
        await queryRunner.query(`
        INSERT INTO security.perfil_permission (permission_id, perfil_id) VALUES
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.LER_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.MODIFICAR_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${AuxiliarPermission.LER_AUXILIAR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${AuxiliarPermission.MODIFICAR_AUXILIAR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${PerfilPermission.LER_PERFIL}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${PerfilPermission.MODIFICAR_PERFIL}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${PermissionsPermission.LER_PERMISSIONS}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${PermissionsPermission.MODIFICAR_PERMISSIONS}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${SetorPermission.LER_SETOR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${SetorPermission.MODIFICAR_SETOR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${OrgaoPermission.LER_ORGAO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${OrgaoPermission.MODIFICAR_ORGAO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.LER_DASHBOARD}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.LER_DASHBOARD_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.MODIFICAR_DASHBOARD}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${RelatoriodPermission.LER_RELATORIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}')),
            ((SELECT id FROM security.permission WHERE nome = '${RelatoriodPermission.MODIFICAR_RELATORIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}'))
        `)

        /** --------------
        @PERFIL_PERMISSOES Gestor
        -------------- */
        // INSERÇÃO DE PERMISSOES NO PERFIL Gestor
        await queryRunner.query(`
        INSERT INTO security.perfil_permission (permission_id, perfil_id) VALUES
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.LER_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.MODIFICAR_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${PerfilPermission.LER_PERFIL}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${PermissionsPermission.LER_PERMISSIONS}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${AuxiliarPermission.LER_AUXILIAR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${SetorPermission.LER_SETOR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${OrgaoPermission.LER_ORGAO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.LER_DASHBOARD}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.LER_DASHBOARD_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}')),
            ((SELECT id FROM security.permission WHERE nome = '${RelatoriodPermission.LER_RELATORIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Gestor}'))
        `)

        /** --------------
        @PERFIL_PERMISSOES Usuario
        -------------- */
        // INSERÇÃO DE PERMISSOES NO PERFIL Usuario
        await queryRunner.query(`
        INSERT INTO security.perfil_permission (permission_id, perfil_id) VALUES
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.LER_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${UsuarioPermission.MODIFICAR_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${PerfilPermission.LER_PERFIL}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${PermissionsPermission.LER_PERMISSIONS}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${AuxiliarPermission.LER_AUXILIAR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${SetorPermission.LER_SETOR}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${OrgaoPermission.LER_ORGAO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${DashboardPermission.LER_DASHBOARD_USUARIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}')),
            ((SELECT id FROM security.permission WHERE nome = '${RelatoriodPermission.LER_RELATORIO}'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Usuario}'))
        `)

        // INSERÇÃO DE STATUS DE STATUS DE REGISTRO NA TABELA AUXILIAR
        await queryRunner.query(`
        INSERT INTO public.auxiliar (valor, descricao, chave) VALUES
            ('${statusRegistroEnum.CANCELADO}', 'CANCELADO', '${keyAuxiliarEnum.STATUS_REGISTRO}'),
            ('${statusRegistroEnum.CONCLUIDA}', 'CONCLUIDA', '${keyAuxiliarEnum.STATUS_REGISTRO}'),
            ('${statusRegistroEnum.FECHADO_AUTOMATICO_PENDENTE}', 'FECHADO AUTOMATICO PENDENTE', '${keyAuxiliarEnum.STATUS_REGISTRO}'),
            ('${statusRegistroEnum.FECHADO_COM_SOLUÇÃO_ALTERNATIVA}', 'FECHADO COM SOLUÇÃO ALTERNATIVA', '${keyAuxiliarEnum.STATUS_REGISTRO}'),
            ('${statusRegistroEnum.FECHADO_COM_SUCESSO}', 'FECHADO COM SUCESSO', '${keyAuxiliarEnum.STATUS_REGISTRO}'),
            ('${statusRegistroEnum.FECHADO_SEM_SUCESSO}', 'FECHADO SEM SUCESSO', '${keyAuxiliarEnum.STATUS_REGISTRO}')
        `)

        // INSERÇÃO DE TIPO DO REGISTRO NA TABELA AUXILIAR
        await queryRunner.query(`
        INSERT INTO public.auxiliar (valor, descricao, chave) VALUES
            ('${tipoRegistroEnum.CHAMADO}', 'CHAMADO', '${keyAuxiliarEnum.TIPO_REGISTRO}'),
            ('${tipoRegistroEnum.PROJETO}', 'PROJETO', '${keyAuxiliarEnum.TIPO_REGISTRO}')
        `)

        // INSERÇÃO DE EMPRESA NA TABELA AUXILIAR
        await queryRunner.query(`
        INSERT INTO public.auxiliar (valor, descricao, chave) VALUES
            ('${tipoEmpresaEnum.PUBLICA}', 'PUBLICA', '${keyAuxiliarEnum.EMPRESA}'),
            ('${tipoEmpresaEnum.PRIVADA}', 'PRIVADA', '${keyAuxiliarEnum.EMPRESA}')
        `)

        /** --------------
        @ORGAO
        -------------- */
        // INSERÇÃO DE ORGAOS NA TABELA ORGAO
        await queryRunner.query(`
        INSERT INTO public.orgao (nome, sigla) VALUES
            ('Empresa Publica Parcerias','MPP'),
            ('Empresa Privada','MP')
        `)

        /** --------------
        @SETOR
        -------------- */
        // INSERÇÃO DE SETORES NA TABELA SETOR
        await queryRunner.query(`
            INSERT INTO public.setor (nome, fk_orgao) VALUES
                ('Infraestrutura', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Governança', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Desenvolvimento', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Cliente', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Administrativo', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Escritório de Projetos', (SELECT id FROM public.orgao WHERE sigla = 'MPP')),
                ('Gabinete', (SELECT id FROM public.orgao WHERE sigla = 'MPP'))
        `)

        /** --------------
        @USUÁRIO
        -------------- */
        // CRIA SENHA CRIPTOGRAFADA
        const senha = await bcrypt.hash(process.env.ADMIN_PWD, 12);
        const email = (process.env.ADMIN_EMAIL);

        // INSERÇÃO DE USUÁRIO NA TABELA USUARIO
        await queryRunner.query(`
            INSERT INTO security.usuario (nome, email, cpf, senha, ativo, redefinir_pass, fk_setor, fk_perfil) VALUES
                ('Admin MPP', '${email}', '12345678900', '${senha}', 'true', 'false', (SELECT g.id FROM public.setor g LEFT JOIN public.orgao o ON g.fk_orgao = o.id WHERE o.sigla = 'MPP' and g.nome = 'Infraestrutura'), (SELECT id FROM security.perfil WHERE nome = '${PerfilEnum.Admin}'))
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.clearTable('public.orgao');
        await queryRunner.clearTable('public.setor');
        await queryRunner.clearTable('public.dashboard');
        await queryRunner.clearTable('public.relatorio');
        await queryRunner.clearTable('security.perfil');
        await queryRunner.clearTable('security.permission');
        await queryRunner.clearTable('security.usuario');
    }

}
