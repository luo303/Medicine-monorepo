import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitKnowledge1779000000000 implements MigrationInterface {
  name = 'InitKnowledge1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE "knowledge_file" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_user_id" integer NOT NULL,
        "owner_username" character varying(100) NOT NULL,
        "visibility" character varying(16) NOT NULL DEFAULT 'private',
        "original_name" character varying(255) NOT NULL,
        "mime_type" character varying(120),
        "size" bigint NOT NULL,
        "chunk_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_knowledge_file_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_knowledge_file_owner_created"
      ON "knowledge_file" ("owner_user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_knowledge_file_visibility_created"
      ON "knowledge_file" ("visibility", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_chunk" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "file_id" uuid NOT NULL,
        "chunk_index" integer NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "embedding" vector NOT NULL,
        CONSTRAINT "PK_knowledge_chunk_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_knowledge_chunk_file_id"
          FOREIGN KEY ("file_id")
          REFERENCES "knowledge_file"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_knowledge_chunk_file_id"
      ON "knowledge_chunk" ("file_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_knowledge_chunk_file_id"`);
    await queryRunner.query(`DROP TABLE "knowledge_chunk"`);
    await queryRunner.query(
      `DROP INDEX "IDX_knowledge_file_visibility_created"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_knowledge_file_owner_created"`);
    await queryRunner.query(`DROP TABLE "knowledge_file"`);
  }
}
