import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEndDateToRounds1740200100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change startDate column from timestamp to date (keeping existing data)
    await queryRunner.query(
      `ALTER TABLE "rounds" ALTER COLUMN "startDate" TYPE date USING "startDate"::date`,
    );

    // Add endDate column
    await queryRunner.query(
      `ALTER TABLE "rounds" ADD COLUMN "endDate" date NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove endDate column
    await queryRunner.query(`ALTER TABLE "rounds" DROP COLUMN "endDate"`);

    // Revert startDate back to timestamp
    await queryRunner.query(
      `ALTER TABLE "rounds" ALTER COLUMN "startDate" TYPE timestamp USING "startDate"::timestamp`,
    );
  }
}
