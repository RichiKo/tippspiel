import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBonusRulesTable1741000000000 implements MigrationInterface {
  name = 'CreateBonusRulesTable1741000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bonus_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "championshipId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "name" character varying(200) NOT NULL,
        "config" jsonb NOT NULL,
        "deadline" TIMESTAMP NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bonus_rules" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "bonus_rules" ADD CONSTRAINT "FK_bonus_rules_championship" 
       FOREIGN KEY ("championshipId") REFERENCES "championships"("id") 
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bonus_rules" DROP CONSTRAINT "FK_bonus_rules_championship"`,
    );
    await queryRunner.query(`DROP TABLE "bonus_rules"`);
  }
}
