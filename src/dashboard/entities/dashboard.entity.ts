import { Orgao } from "src/orgao/entities/orgao.entity";
import { Perfil } from "src/perfil/entities/perfil.entity"
import { Setor } from "src/setor/entities/setor.entity";
import { BaseEntity } from "src/utils/entities/base.entity";
import { Column, Entity, Generated, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "dashboard", schema: "public"})
export class Dashboard extends BaseEntity{
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

	@Column({ nullable: true, default: false })
    home: boolean;
    
	@Column({ unique: true, nullable: false })
    url: string;

	@Column({ nullable: false })
    icone: string;

    @ManyToOne(() => Orgao, orgao => orgao.dashboard, { eager: true, nullable: true })
    @JoinColumn({ name: 'fk_orgao' })
    orgao: Orgao;

	@ManyToOne(() => Setor, setor => setor.dashboard, { eager: true, nullable: true })
    @JoinColumn({ name: 'fk_setor' })
    setor: Setor;
    
	@ManyToMany(() => Perfil, perfil => perfil.dashboard, { eager: true })
	@JoinTable({
		name: 'dashboard_perfil',
		schema: 'security'
	})
    perfil: Perfil[];
}
