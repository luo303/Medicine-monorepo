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
  IPU_API_KEY: string;
}
export interface config {
  DB: db;
  AI: AI;
}
