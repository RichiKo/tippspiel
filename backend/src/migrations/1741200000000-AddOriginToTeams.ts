import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginToTeams1741200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "team_origin_enum" AS ENUM('ENGLAND', 'GERMANY', 'SPAIN', 'ITALY', 'FRANCE', 'NATIONAL', 'OTHER')`,
    );

    await queryRunner.query(
      `ALTER TABLE "teams" ADD "origin" "team_origin_enum" NOT NULL DEFAULT 'OTHER'`,
    );

    await queryRunner.query(
      `UPDATE "teams" SET "origin" = 'OTHER' WHERE "origin" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "origin"`);
    await queryRunner.query(`DROP TYPE "team_origin_enum"`);
  }
}

