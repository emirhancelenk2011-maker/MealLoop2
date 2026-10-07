import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const databaseDir = resolve('.local-postgres');
const database = new EmbeddedPostgres({
  databaseDir, user: 'meal_loop', password: 'meal_loop_local',
  port: 54329, persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-h', '127.0.0.1'],
});
try {
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await database.initialise();
  await database.start();
  const client = new pg.Client({ host: '127.0.0.1', port: 54329, user: 'meal_loop', password: 'meal_loop_local', database: 'postgres' });
  await client.connect();
  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname='meal_loop'");
  if (!existing.rowCount) await client.query('CREATE DATABASE meal_loop');
  await client.end();
  console.log('Local PostgreSQL ready on 127.0.0.1:54329. Data is kept in .local-postgres. Ctrl+C to stop.');
  let stopping = false;
  const stop = async () => { if (stopping) return; stopping = true; await database.stop(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) { console.error(error); process.exitCode = 1; }
