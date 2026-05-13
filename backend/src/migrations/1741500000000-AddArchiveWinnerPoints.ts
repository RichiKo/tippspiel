import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArchiveWinnerPoints1741500000000
  implements MigrationInterface
{
  name = 'AddArchiveWinnerPoints1741500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD COLUMN IF NOT EXISTS "firstPlacePoints" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD COLUMN IF NOT EXISTS "secondPlacePoints" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD COLUMN IF NOT EXISTS "thirdPlacePoints" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP COLUMN IF EXISTS "thirdPlacePoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP COLUMN IF EXISTS "secondPlacePoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP COLUMN IF EXISTS "firstPlacePoints"`,
    );
  }
}
