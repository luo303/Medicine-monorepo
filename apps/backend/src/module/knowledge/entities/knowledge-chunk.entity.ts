import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { KnowledgeFile } from './knowledge-file.entity';

@Entity('knowledge_chunk')
export class KnowledgeChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId: string;

  @ManyToOne(() => KnowledgeFile, (file) => file.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'file_id' })
  file: KnowledgeFile;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column('vector')
  embedding: number[];
}
