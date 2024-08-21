import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity {
  @CreateDateColumn({ nullable: false })
  createdAt: Date;
  
  @Column({ nullable: true })
  createdBy: string;
  
  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy: string;
}