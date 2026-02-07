import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeTipGoalsNullable1740600000000 implements MigrationInterface {
    name = 'MakeTipGoalsNullable1740600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "homeTeamGoals" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "awayTeamGoals" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."tips_outcometype_enum" RENAME TO "tips_outcometype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tips_outcometype_enum" AS ENUM('exact', 'goalDiff', 'tendency', 'missed', 'notTipped')`);
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "outcomeType" TYPE "public"."tips_outcometype_enum" USING "outcomeType"::"text"::"public"."tips_outcometype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tips_outcometype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tips_outcometype_enum_old" AS ENUM('exact', 'goalDiff', 'tendency', 'missed')`);
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "outcomeType" TYPE "public"."tips_outcometype_enum_old" USING "outcomeType"::"text"::"public"."tips_outcometype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."tips_outcometype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tips_outcometype_enum_old" RENAME TO "tips_outcometype_enum"`);
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "awayTeamGoals" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tips" ALTER COLUMN "homeTeamGoals" SET NOT NULL`);
    }

}
