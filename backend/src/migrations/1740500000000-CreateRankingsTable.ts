import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRankingsTable1740500000000 implements MigrationInterface {
    name = 'CreateRankingsTable1740500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rankings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "championshipId" uuid NOT NULL, "rank" integer NOT NULL DEFAULT '0', "exactHits" integer NOT NULL DEFAULT '0', "goalDiffHits" integer NOT NULL DEFAULT '0', "tendencyHits" integer NOT NULL DEFAULT '0', "missedTips" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_05d87d598d485338c9980373d20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_766f5c1de9c6c5b7b37eda6d42" ON "rankings" ("userId", "championshipId") `);
        await queryRunner.query(`ALTER TABLE "rankings" ADD CONSTRAINT "FK_430fa616d89023b764c714fbcf5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rankings" ADD CONSTRAINT "FK_2d4f1dfdc5a16c9bcf87999c74b" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rankings" DROP CONSTRAINT "FK_2d4f1dfdc5a16c9bcf87999c74b"`);
        await queryRunner.query(`ALTER TABLE "rankings" DROP CONSTRAINT "FK_430fa616d89023b764c714fbcf5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_766f5c1de9c6c5b7b37eda6d42"`);
        await queryRunner.query(`DROP TABLE "rankings"`);
    }

}
