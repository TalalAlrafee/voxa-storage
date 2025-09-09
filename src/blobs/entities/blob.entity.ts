import { Entity, PrimaryColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('blobs')
@Unique(['id']) // This prevents duplicate IDs at database level
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
