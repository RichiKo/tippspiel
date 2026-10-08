import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseFixedPrizeAmounts1791417600001 implements MigrationInterface {
  name = 'UseFixedPrizeAmounts1791417600001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Freeze the former equal distribution using active memberships at migration time.
    await queryRunner.query(`UPDATE "championships" c
      SET "prizeFundRule" = (c."prizeFundRule" - 'prizePlaceCount') || jsonb_build_object(
        'prizeAmountsMinorUnits', (
          SELECT jsonb_agg((div(snapshot.fund, snapshot.places) +
            CASE WHEN position <= mod(snapshot.fund, snapshot.places) THEN 1 ELSE 0 END)::text ORDER BY position)
          FROM generate_series(1::bigint, snapshot.places) AS position
        )
      )
      FROM (
        SELECT championship.id,
          (championship."prizeFundRule"->>'prizePlaceCount')::bigint AS places,
          championship."entryFeeMinorUnits"::numeric *
            (SELECT count(*) FROM "memberships" m WHERE m."championshipId" = championship.id AND m.status = 'active') AS fund
        FROM "championships" championship
        WHERE NOT championship."prizeFundRule" ? 'prizeAmountsMinorUnits'
      ) snapshot
      WHERE c.id = snapshot.id`);
    await queryRunner.query(`ALTER TABLE "championships" ALTER COLUMN "prizeFundRule"
      SET DEFAULT '{"tieMode":"share_equal_points","prizeAmountsMinorUnits":["0","0","0"]}'::jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The old format can keep the number of places, but cannot represent fixed amounts.
    await queryRunner.query(`UPDATE "championships"
      SET "prizeFundRule" = ("prizeFundRule" - 'prizeAmountsMinorUnits') ||
        jsonb_build_object('prizePlaceCount', jsonb_array_length("prizeFundRule"->'prizeAmountsMinorUnits'))
      WHERE "prizeFundRule" ? 'prizeAmountsMinorUnits'`);
    await queryRunner.query(`ALTER TABLE "championships" ALTER COLUMN "prizeFundRule"
      SET DEFAULT '{"tieMode":"share_equal_points","prizePlaceCount":3}'::jsonb`);
  }
}
