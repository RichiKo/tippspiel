import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBonusPicksTable1741000000001 implements MigrationInterface {
  name = 'CreateBonusPicksTable1741000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bonus_picks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bonusRuleId" uuid NOT NULL,
        "userId" integer NOT NULL,
        "teamId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bonus_picks" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bonus_pick_rule_user" ON "bonus_picks" ("bonusRuleId", "userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" ADD CONSTRAINT "FK_bonus_picks_bonusRule" 
       FOREIGN KEY ("bonusRuleId") REFERENCES "bonus_rules"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" ADD CONSTRAINT "FK_bonus_picks_user" 
       FOREIGN KEY ("userId") REFERENCES "users"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" ADD CONSTRAINT "FK_bonus_picks_team" 
       FOREIGN KEY ("teamId") REFERENCES "teams"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" DROP CONSTRAINT "FK_bonus_picks_team"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" DROP CONSTRAINT "FK_bonus_picks_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_picks" DROP CONSTRAINT "FK_bonus_picks_bonusRule"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_bonus_pick_rule_user"`);
    await queryRunner.query(`DROP TABLE "bonus_picks"`);
  }
}
