import { Auxiliar } from "src/auxiliar/entities/auxiliar.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { Relatorio } from "src/relatorio/entities/relatorio.entity";
import { Setor } from "src/setor/entities/setor.entity";
import { BaseEntity } from "src/utils/entities/base.entity";
import { Column, DeleteDateColumn, Entity, Generated, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'usuario', schema: 'security'})
export class Usuario extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true, unique: true })
	@Generated('uuid')
	@Index()
    idPublic: string;

    @Column({ nullable: true })
    nome: string;

    @Column({ nullable: true, unique: true })
    email: string;

    @Column({ nullable: true, unique: false })
    cpf: string;

    @Column({ nullable: true, select: false })
    senha: string;

    @ManyToOne(() => Auxiliar, { nullable: true })
    @JoinColumn({ name: 'fk_empresa' })
    empresa: Auxiliar;

    @Column({ nullable: true, default: 160 })
    jornada: number;

    @Column({ nullable: true, type: 'decimal', precision: 19, scale: 2, default: 0 })
    salario: number;
        
    @Column({ nullable: true, default: true })
    ativo: boolean;

    @Column({ nullable: true, default: true })
    redefinirPass: boolean;

    @ManyToOne(() => Setor, setor => setor.usuario, { eager: true, nullable: true })
    @JoinColumn({ name: 'fk_setor' })
    setor: Setor;

    @ManyToOne(() => Perfil, perfil => perfil.usuario, { eager: true })
    @JoinColumn({ name: 'fk_perfil' })
    perfil: Perfil;

    @OneToMany(() => Relatorio, relatorio => relatorio.responsavel)
    relatorio: Relatorio;

    @Column({ nullable: true })
    lastAccess: Date;

    @Column({ nullable: true })
    firstAccess: Date;

    @DeleteDateColumn({ nullable: true })
    dataDelete: Date;
}