import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeChunk } from './entities/knowledge-chunk.entity';
import { KnowledgeFile } from './entities/knowledge-file.entity';
import { KNOWLEDGE_DB_CONNECTION } from './knowledge.types';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [KnowledgeFile, KnowledgeChunk],
      KNOWLEDGE_DB_CONNECTION,
    ),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
