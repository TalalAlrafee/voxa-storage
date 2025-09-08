import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blobs')
export class Blob {
  @PrimaryColumn()
  id: string;

  @Column()
  size: number;

  @Column()
  storageBackend: string;

  @Column()
  storagePath: string;

  @CreateDateColumn()
  created_at: Date;
}
