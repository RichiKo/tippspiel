import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBonusEvaluationsTable1741000000002
  implements MigrationInterface
{
  name = 'CreateBonusEvaluationsTable1741000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bonus_evaluations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bonusRuleId" uuid NOT NULL,
        "userId" integer NOT NULL,
        "subrule" character varying(50) NOT NULL,
        "points" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bonus_evaluations" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bonus_evaluation_rule_user_subrule" 
       ON "bonus_evaluations" ("bonusRuleId", "userId", "subrule")`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_evaluations" ADD CONSTRAINT "FK_bonus_evaluations_bonusRule" 
       FOREIGN KEY ("bonusRuleId") REFERENCES "bonus_rules"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_evaluations" ADD CONSTRAINT "FK_bonus_evaluations_user" 
       FOREIGN KEY ("userId") REFERENCES "users"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bonus_evaluations" DROP CONSTRAINT "FK_bonus_evaluations_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_evaluations" DROP CONSTRAINT "FK_bonus_evaluations_bonusRule"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bonus_evaluation_rule_user_subrule"`,
    );
    await queryRunner.query(`DROP TABLE "bonus_evaluations"`);
  }
}
