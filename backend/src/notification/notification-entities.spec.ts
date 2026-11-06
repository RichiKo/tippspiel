import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('Notification entity metadata', () => {
  it('validates PostgreSQL metadata in the local transpile-only startup mode', () => {
    const script = `
      require('reflect-metadata');
      const { DataSource } = require('typeorm');
      const db = new DataSource({
        type: 'postgres',
        entities: ['src/**/*.entity.ts'],
        synchronize: false,
      });
      db.buildMetadatas().then(() => {
        process.stdout.write('PostgreSQL entity metadata validated');
      }).catch(error => {
        process.stderr.write(error.name + ': ' + error.message);
        process.exitCode = 1;
      });
    `;
    const result = spawnSync(
      process.execPath,
      [
        '-r',
        'ts-node/register/transpile-only',
        '-r',
        'tsconfig-paths/register',
        '-e',
        script,
      ],
      {
        cwd: resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 90_000,
      },
    );

    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PostgreSQL entity metadata validated');
  }, 100_000);
});
