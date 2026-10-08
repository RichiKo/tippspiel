import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrizeFundConfiguration1791417600000
  implements MigrationInterface
{
  name = 'AddPrizeFundConfiguration1791417600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "championships"
      ADD COLUMN "entryFeeMinorUnits" bigint NOT NULL DEFAULT 0,
      ADD COLUMN "prizeFundRule" jsonb NOT NULL DEFAULT '{"tieMode":"share_equal_points","prizePlaceCount":3}'::jsonb,
      ADD CONSTRAINT "CHK_championship_entry_fee" CHECK ("entryFeeMinorUnits" >= 0)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "championships"
      DROP CONSTRAINT "CHK_championship_entry_fee",
      DROP COLUMN "prizeFundRule",
      DROP COLUMN "entryFeeMinorUnits"`);
  }
}
