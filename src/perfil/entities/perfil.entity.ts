import { Dashboard } from "src/dashboard/entities/dashboard.entity";
import { Permission } from "src/permission/entities/permission.entity";
import { Relatorio } from "src/relatorio/entities/relatorio.entity";
import { Usuario } from "src/usuarios/entities/usuario.entity";
import { Generated, Index, Column, JoinTable, ManyToMany, PrimaryGeneratedColumn, Entity, BaseEntity, OneToMany } from "typeorm";

@Entity({ name: 'perfil', schema: 'security' })
export class Perfil extends BaseEntity{
    @PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, unique: true })
	@Generated('uuid')
	@Index()
	idPublic: string;

	@Column({ unique: true, nullable: false })
	nome: string;

	@Column({ nullable: false, default: true })
	ativo: boolean;

	@ManyToMany(() => Permission, permission => permission.perfil, { eager: true })
	@JoinTable({
		name: 'perfil_permission',
		schema: 'security'
	})
	permission: Permission[];

	@ManyToMany(() => Dashboard, dashboard => dashboard.perfil)
	@JoinTable({
		name: 'dashboard_perfil',
		schema: 'security'
	})
	dashboard: Dashboard[];

	@ManyToMany(() => Relatorio, relatorio => relatorio.perfil)
	@JoinTable({
		name: 'relatorio_perfil',
		schema: 'security'
	})
	relatorio: Relatorio[];

    @OneToMany(() => Usuario, usuario => usuario.perfil)
	usuario: Usuario[];
}
