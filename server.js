require('dotenv').config();
const { Pool } = require('pg');
const { createApp } = require('./src/app');
const { migrate } = require('./src/database');

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Copy .env.example to .env and run npm run db:start.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await migrate(pool);
  const server = createApp(pool).listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log('Meal Loop: http://localhost:' + (process.env.PORT || 3000)));
  const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exit(1); });
module.exports = { createApp };
