const { Pool } = require('pg');
const { createServerlessHandler } = require('../src/serverless');
const { errorPayload } = require('../src/errors');

// Reuse the pool across requests in the same Vercel function instance.
let handler;
module.exports = (req, res) => {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL to a hosted PostgreSQL connection string in Vercel Environment Variables, then redeploy.');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(errorPayload('server_error', req.headers['accept-language'])));
  }
  if (!handler) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    pool.on('error', error => console.error('PostgreSQL idle connection failed:', error.code || error.name));
    // Vercel terminates HTTPS at its proxy. Local Express keeps trust proxy off.
    handler = createServerlessHandler(pool, { trustProxy: 1 });
  }
  return handler(req, res);
};
