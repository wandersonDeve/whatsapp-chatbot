import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableName1709517758038 implements MigrationInterface {
  name = 'CreateTableName1709517758038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "message" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_url" character varying, "version" character varying NOT NULL, "book" character varying NOT NULL, "chapter" integer NOT NULL, "verse" integer NOT NULL, "publication_date" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c5cb33791204380214230107d5" PRIMARY KEY ("uuid"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "message"`);
  }
}
