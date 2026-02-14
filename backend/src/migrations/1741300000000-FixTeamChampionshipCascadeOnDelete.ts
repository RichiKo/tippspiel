import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTeamChampionshipCascadeOnDelete1741300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_championships" DROP CONSTRAINT IF EXISTS "FK_51d7f4e8067781d881baac33fad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_championships" ADD CONSTRAINT "FK_51d7f4e8067781d881baac33fad" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_championships" DROP CONSTRAINT IF EXISTS "FK_51d7f4e8067781d881baac33fad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_championships" ADD CONSTRAINT "FK_51d7f4e8067781d881baac33fad" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

