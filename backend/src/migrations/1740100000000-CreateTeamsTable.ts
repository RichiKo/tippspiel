import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTeamsTable1740100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'shortName',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'logoUrl',
            type: 'varchar',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Create team_championships join table
    await queryRunner.createTable(
      new Table({
        name: 'team_championships',
        columns: [
          {
            name: 'teamId',
            type: 'uuid',
          },
          {
            name: 'championshipId',
            type: 'uuid',
          },
        ],
      }),
    );

    // Add composite primary key
    await queryRunner.query(
      `ALTER TABLE "team_championships" ADD CONSTRAINT "PK_team_championships" PRIMARY KEY ("teamId", "championshipId")`,
    );

    // Add foreign key for teamId
    await queryRunner.createForeignKey(
      'team_championships',
      new TableForeignKey({
        columnNames: ['teamId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for championshipId
    await queryRunner.createForeignKey(
      'team_championships',
      new TableForeignKey({
        columnNames: ['championshipId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'championships',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('team_championships');
    await queryRunner.dropTable('teams');
  }
}
