export const KNOWLEDGE_DB_CONNECTION = 'knowledge';

export enum KnowledgeVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export interface KnowledgeUserContext {
  userId: number;
  username: string;
}
