import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArchiveEntriesTable1741400000000
  implements MigrationInterface
{
  name = 'CreateArchiveEntriesTable1741400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "archive_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "championshipName" character varying(120) NOT NULL,
        "year" integer NOT NULL,
        "firstPlaceUserId" integer,
        "firstPlaceManualName" character varying(100),
        "firstPlaceDisplayName" character varying(100) NOT NULL,
        "firstPlacePoints" integer NOT NULL DEFAULT 0,
        "secondPlaceUserId" integer,
        "secondPlaceManualName" character varying(100),
        "secondPlaceDisplayName" character varying(100) NOT NULL,
        "secondPlacePoints" integer NOT NULL DEFAULT 0,
        "thirdPlaceUserId" integer,
        "thirdPlaceManualName" character varying(100),
        "thirdPlaceDisplayName" character varying(100) NOT NULL,
        "thirdPlacePoints" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_archive_entries" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_archive_entries_year_name" ON "archive_entries" ("year", "championshipName")`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD CONSTRAINT "FK_archive_entries_first_place_user" FOREIGN KEY ("firstPlaceUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD CONSTRAINT "FK_archive_entries_second_place_user" FOREIGN KEY ("secondPlaceUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" ADD CONSTRAINT "FK_archive_entries_third_place_user" FOREIGN KEY ("thirdPlaceUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP CONSTRAINT "FK_archive_entries_third_place_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP CONSTRAINT "FK_archive_entries_second_place_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "archive_entries" DROP CONSTRAINT "FK_archive_entries_first_place_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_archive_entries_year_name"`);
    await queryRunner.query(`DROP TABLE "archive_entries"`);
  }
}
