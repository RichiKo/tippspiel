import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBonusPointsToRankings1741000000003
  implements MigrationInterface
{
  name = 'AddBonusPointsToRankings1741000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rankings" ADD COLUMN "bonusPoints" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rankings" DROP COLUMN "bonusPoints"`);
  }
}
