require('dotenv').config();
const { Pool } = require('pg');
const { seed } = require('../src/database');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Copy .env.example to .env before seeding.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
seed(pool).then(() => console.log('Demo accounts and packages are ready. Existing records were preserved.')).catch(error => { console.error(error); process.exitCode=1; }).finally(() => pool.end());
