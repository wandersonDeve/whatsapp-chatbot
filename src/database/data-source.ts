import * as dotenv from 'dotenv';
import { join } from 'path';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
dotenv.config();

export const postgresConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../**/migration/*{.ts,.js}')],
  ssl: true,
};

export const AppDataSource = new DataSource({
  ...postgresConfig,
});
