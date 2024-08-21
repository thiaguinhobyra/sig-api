import { Column, Entity, Generated, Index, PrimaryGeneratedColumn, Unique } from "typeorm";
import { keyAuxiliarEnum } from "../enum/keyAuxiliar.enum";

@Unique(['valor', 'chave'])
@Entity({ name: 'auxiliar', schema: 'public' })
export class Auxiliar {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    @Generated("uuid")
    @Index()
    idPublic: string;

    @Column({ nullable: false })
    valor: string;

    @Column({ nullable: false })
    descricao: string;

    @Column({ type: "enum", enum: keyAuxiliarEnum })
    chave: keyAuxiliarEnum;
}
