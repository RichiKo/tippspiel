import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEliminatedTeamsToChampionships1741100000000
  implements MigrationInterface
{
  name = 'AddEliminatedTeamsToChampionships1741100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "championships" ADD "eliminatedTeamIds" text NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "championships" DROP COLUMN "eliminatedTeamIds"`,
    );
  }
}
