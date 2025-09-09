import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blob_data')
export class BlobData {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'blob' })
  data: Buffer;

  @CreateDateColumn()
  created_at: Date;
}
