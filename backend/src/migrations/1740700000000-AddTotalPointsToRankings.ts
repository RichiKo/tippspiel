import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTotalPointsToRankings1740700000000 implements MigrationInterface {
    name = 'AddTotalPointsToRankings1740700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rankings" ADD "totalPoints" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rankings" DROP COLUMN "totalPoints"`);
    }

}
