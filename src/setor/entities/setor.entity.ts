import { Dashboard } from "src/dashboard/entities/dashboard.entity";
import { Orgao } from "src/orgao/entities/orgao.entity";
import { Relatorio } from "src/relatorio/entities/relatorio.entity";
import { Usuario } from "src/usuarios/entities/usuario.entity";
import { Column, Entity, Generated, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'setor', schema: 'public' })
export class Setor {
    @PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, unique: true })
	@Generated("uuid")
	@Index()
	idPublic: string;

    @Column({ nullable: true, unique: true })
	nome: string;

    @Column({ default: true })
    ativo: boolean;

    @ManyToOne(() => Orgao, orgao => orgao.setor, { eager: true, nullable: false, cascade: true })
    @JoinColumn({ name: 'fk_orgao' })
    orgao: Orgao;

    @OneToMany(() => Usuario, usuario => usuario.setor)
    usuario: Usuario[]

    @OneToMany(() => Dashboard, dashboard => dashboard.setor)
    dashboard: Dashboard[]

    @OneToMany(() => Relatorio, relatorio => relatorio.setor)
    relatorio: Relatorio[]
}
