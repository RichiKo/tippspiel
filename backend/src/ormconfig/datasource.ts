import { DataSource, DataSourceOptions } from 'typeorm';
import { ormConfig } from './ormoptions.config';

export default new DataSource({
  ...ormConfig,
  migrations: [__dirname + '/../migrations/*.ts'],
} as DataSourceOptions);
