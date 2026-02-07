import { MigrationInterface, QueryRunner } from "typeorm";

export class RecalculateTotalPoints1740700000001 implements MigrationInterface {
    name = 'RecalculateTotalPoints1740700000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update all existing rankings with calculated totalPoints
        await queryRunner.query(`
            UPDATE "rankings" 
            SET "totalPoints" = ("exactHits" * 3) + ("goalDiffHits" * 2) + ("tendencyHits" * 1)
            WHERE "totalPoints" = 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reset totalPoints to 0
        await queryRunner.query(`UPDATE "rankings" SET "totalPoints" = 0`);
    }

}
