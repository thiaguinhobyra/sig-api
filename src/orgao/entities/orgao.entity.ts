import { Dashboard } from "src/dashboard/entities/dashboard.entity";
import { Setor } from "src/setor/entities/setor.entity";
import { Column, Entity, Generated, Index, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'orgao', schema: 'public' })
export class Orgao {
    @PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, unique: true })
	@Generated("uuid")
	@Index()
	idPublic: string;

	@Column({ nullable: false })
	nome: string;

	@Column({ nullable: false, unique: true })
	sigla: string;

	@Column({ nullable: false, default: true })
    ativo: boolean;

    @OneToMany(() => Setor, setor => setor.orgao)
    setor: Setor[];

	@OneToMany(() => Dashboard, dashboard => dashboard.orgao)
    dashboard: Dashboard[]
}
