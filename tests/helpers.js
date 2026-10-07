require('dotenv').config({ quiet: true });
const { Pool, Client } = require('pg');
const { seed } = require('../src/database');
const { createApp } = require('../src/app');

async function fixture(port = 0) {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running tests.');
  const schema = `test_mealloop_${process.pid}_${Date.now()}`;
  const admin = new Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, options:`-c search_path=${schema}`, max:20 });
  let server;
  const close = async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await pool.end();
    try {
      // This generated schema never names an existing application schema.
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally { await admin.end(); }
  };
  try {
    await seed(pool);
    server = createApp(pool).listen(port,'127.0.0.1');
    await new Promise((resolve,reject) => { server.once('listening',resolve); server.once('error',reject); });
  } catch (error) { await close(); throw error; }
  return {
    pool, server, base:`http://127.0.0.1:${server.address().port}`,
    close,
  };
}
module.exports = { fixture };
