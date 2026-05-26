export const jwtConstants = {
  secret: 'basketball',
};

interface db {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface AI {
  ZHIPU_API_KEY?: string;
  ZHIPU_BASE_URL?: string;
  EMBEDDING_MODEL: string;
  CHAT_MODEL: string;
  THINKING_ENABLED?: boolean;
  THINKING_TYPE?: string;
  TOOL_STREAM_ENABLED?: boolean;
}

export interface config {
  DB: db;
  KNOWLEDGE_DB: db;
  AI: AI;
}
