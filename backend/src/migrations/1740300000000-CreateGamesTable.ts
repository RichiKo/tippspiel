import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableCheck,
} from 'typeorm';

export class CreateGamesTable1740300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'games',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'homeTeamId',
            type: 'uuid',
          },
          {
            name: 'awayTeamId',
            type: 'uuid',
          },
          {
            name: 'kickoffTime',
            type: 'timestamp',
          },
          {
            name: 'roundId',
            type: 'uuid',
          },
          {
            name: 'homeScore',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'awayScore',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isClosed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Foreign key for homeTeamId
    await queryRunner.createForeignKey(
      'games',
      new TableForeignKey({
        columnNames: ['homeTeamId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'RESTRICT',
      }),
    );

    // Foreign key for awayTeamId
    await queryRunner.createForeignKey(
      'games',
      new TableForeignKey({
        columnNames: ['awayTeamId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'RESTRICT',
      }),
    );

    // Foreign key for roundId
    await queryRunner.createForeignKey(
      'games',
      new TableForeignKey({
        columnNames: ['roundId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rounds',
        onDelete: 'CASCADE',
      }),
    );

    // Check constraint: homeTeamId != awayTeamId
    await queryRunner.createCheckConstraint(
      'games',
      new TableCheck({
        name: 'chk_different_teams',
        expression: '"homeTeamId" != "awayTeamId"',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('games');
  }
}
