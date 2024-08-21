import { Column, Entity, Generated, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

import { Perfil } from 'src/perfil/entities/perfil.entity';
import { BaseEntity } from "src/utils/entities/base.entity";

@Entity({ name: 'permission', schema: 'security' })
export class Permission extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, unique: true })
	@Generated("uuid")
	@Index()
	idPublic: string;

	@Column({ nullable: false, unique: true })
	nome: string;

	@Column({ nullable: false, unique: true })
	descricao: string;

	@ManyToMany(() => Perfil, perfil => perfil.permission)
	@JoinTable({
		name: 'perfil_permission',
		schema: 'security'
	})
	perfil: Perfil[];
	
	@Column({ nullable: false, default: true })
	ativo: boolean;
}
