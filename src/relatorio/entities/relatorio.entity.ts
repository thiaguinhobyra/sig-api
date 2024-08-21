import { Auxiliar } from "src/auxiliar/entities/auxiliar.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { Setor } from "src/setor/entities/setor.entity";
import { Usuario } from "src/usuarios/entities/usuario.entity";
import { BaseEntity } from "src/utils/entities/base.entity";
import { Column, Entity, Generated, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: "relatorio", schema: "public"})
export class Relatorio extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ nullable: true, unique: true })
	@Generated('uuid')
	@Index()
    idPublic: string;
    
	@Column({ nullable: true })
    projeto: string;

	@Column({ nullable: true })
    idTarefa: string;

	@Column({ nullable: true })
    tarefa: string;

	@Column({ nullable: true })
    tipoTarefa: string;

	@Column({ nullable: true, type: 'timestamp without time zone'  })
    dataInicio: Date;

	@Column({ nullable: true, type: 'timestamp without time zone'  })
    dataFim: Date;

	@Column({ nullable: true, type: 'timestamp without time zone'  })
    dataFechamento: Date;

	@Column({ nullable: true })
    descricao: string;

	@Column({ nullable: true })
    horas: string;

	@Column({ nullable: true, type: 'decimal', precision: 19, scale: 2 })
    valorHora: number;

	@Column({ nullable: true, type: 'decimal', precision: 19, scale: 2 })
    valorTarefa: number;

	@Column({ nullable: true, default: true })
    ativo: boolean;

	@ManyToOne(() => Setor, setor => setor.relatorio, { eager: true, nullable: true })
    @JoinColumn({ name: 'fk_setor' })
    setor: Setor;

	@ManyToOne(() => Usuario, responsavel => responsavel.relatorio, { eager: true, nullable: true })
	@JoinColumn({ name: 'fk_usuario' })
    responsavel: Usuario;
    
	@ManyToMany(() => Perfil, perfil => perfil.relatorio, { eager: true })
	@JoinTable({
		name: 'relatorio_perfil',
		schema: 'security'
	})
    perfil: Perfil[];
    
	@ManyToOne(() => Auxiliar, { nullable: true })
    @JoinColumn({ name: 'fk_status' })
    status: Auxiliar;

	@ManyToOne(() => Auxiliar, { nullable: true })
    @JoinColumn({ name: 'fk_tipo_registro' })
    tipo_registro: Auxiliar;
}
