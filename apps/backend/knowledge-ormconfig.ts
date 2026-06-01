import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from './src/configuration';
import { config as configInterface } from './contain';
import { KnowledgeChunk } from './src/module/knowledge/entities/knowledge-chunk.entity';
import { KnowledgeFile } from './src/module/knowledge/entities/knowledge-file.entity';

const configData = config() as configInterface;

export const knowledge = {
  name: 'knowledge',
  type: configData.KNOWLEDGE_DB.type,
  host: configData.KNOWLEDGE_DB.host,
  port: configData.KNOWLEDGE_DB.port,
  username: configData.KNOWLEDGE_DB.username,
  password: configData.KNOWLEDGE_DB.password,
  database: configData.KNOWLEDGE_DB.database,
  entities: [KnowledgeFile, KnowledgeChunk],
  synchronize: false,
} as TypeOrmModuleOptions;

export default new DataSource({
  ...knowledge,
  migrations: ['src/migrations/knowledge/*{.ts,.js}'],
} as DataSourceOptions);
