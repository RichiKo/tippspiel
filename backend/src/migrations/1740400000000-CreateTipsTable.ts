import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTipsTable1740400000000 implements MigrationInterface {
    name = 'CreateTipsTable1740400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team_championships" DROP CONSTRAINT "FK_8898df1866e22e4391eeb5d6544"`);
        await queryRunner.query(`ALTER TABLE "team_championships" DROP CONSTRAINT "FK_51d7f4e8067781d881baac33fad"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "chk_different_teams"`);
        await queryRunner.query(`CREATE TYPE "public"."tips_outcometype_enum" AS ENUM('exact', 'goalDiff', 'tendency', 'missed')`);
        await queryRunner.query(`CREATE TABLE "tips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "gameId" uuid NOT NULL, "championshipId" uuid NOT NULL, "homeTeamGoals" integer NOT NULL, "awayTeamGoals" integer NOT NULL, "points" integer, "outcomeType" "public"."tips_outcometype_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b63a628fdfd7517d8e58fe39199" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_22368abd98df0bc66610f08d7b" ON "tips" ("userId", "gameId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8898df1866e22e4391eeb5d654" ON "team_championships" ("teamId") `);
        await queryRunner.query(`CREATE INDEX "IDX_51d7f4e8067781d881baac33fa" ON "team_championships" ("championshipId") `);
        await queryRunner.query(`ALTER TABLE "tips" ADD CONSTRAINT "FK_1f0395aafbe00daa27387cf5f67" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tips" ADD CONSTRAINT "FK_40a557b4c5e26973908002d9c09" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tips" ADD CONSTRAINT "FK_59d8e70333c315f43ba3dd3700f" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_championships" ADD CONSTRAINT "FK_8898df1866e22e4391eeb5d6544" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "team_championships" ADD CONSTRAINT "FK_51d7f4e8067781d881baac33fad" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team_championships" DROP CONSTRAINT "FK_51d7f4e8067781d881baac33fad"`);
        await queryRunner.query(`ALTER TABLE "team_championships" DROP CONSTRAINT "FK_8898df1866e22e4391eeb5d6544"`);
        await queryRunner.query(`ALTER TABLE "tips" DROP CONSTRAINT "FK_59d8e70333c315f43ba3dd3700f"`);
        await queryRunner.query(`ALTER TABLE "tips" DROP CONSTRAINT "FK_40a557b4c5e26973908002d9c09"`);
        await queryRunner.query(`ALTER TABLE "tips" DROP CONSTRAINT "FK_1f0395aafbe00daa27387cf5f67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51d7f4e8067781d881baac33fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8898df1866e22e4391eeb5d654"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22368abd98df0bc66610f08d7b"`);
        await queryRunner.query(`DROP TABLE "tips"`);
        await queryRunner.query(`DROP TYPE "public"."tips_outcometype_enum"`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "chk_different_teams" CHECK (("homeTeamId" <> "awayTeamId"))`);
        await queryRunner.query(`ALTER TABLE "team_championships" ADD CONSTRAINT "FK_51d7f4e8067781d881baac33fad" FOREIGN KEY ("championshipId") REFERENCES "championships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_championships" ADD CONSTRAINT "FK_8898df1866e22e4391eeb5d6544" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
