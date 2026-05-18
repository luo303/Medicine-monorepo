import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KnowledgeChunk } from './knowledge-chunk.entity';
import { KnowledgeVisibility } from '../knowledge.types';

@Entity('knowledge_file')
export class KnowledgeFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_user_id', type: 'int' })
  ownerUserId: number;

  @Column({ name: 'owner_username', type: 'varchar', length: 100 })
  ownerUsername: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: KnowledgeVisibility.PRIVATE,
  })
  visibility: KnowledgeVisibility;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => KnowledgeChunk, (chunk) => chunk.file)
  chunks: KnowledgeChunk[];
}
