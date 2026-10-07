const fs = require('node:fs/promises');
const path = require('node:path');

async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(726519)');
    await client.query(await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8'));
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seed(pool) {
  await migrate(pool);
  await pool.query(`INSERT INTO users (id, name, role) VALUES
    (1, 'Jasur Rahimov', 'customer'), (2, 'Dilnoza Umarova', 'customer'),
    (3, 'Toshkent Nonvoyxonasi', 'business'), (4, 'Yashil Oshxona', 'business')
    ON CONFLICT (id) DO NOTHING`);
  for (const item of require('../shared/demo-offers.json')) {
    await pool.query(`INSERT INTO packages
      (business_id,title,description,category,address,price,original_price,quantity,pickup_start,pickup_end,seed_key,image_key)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,NOW()+INTERVAL '1 hour',NOW()+INTERVAL '25 hours',$9,$10
      WHERE EXISTS (SELECT 1 FROM users WHERE id=$1 AND role='business'
        AND name IN ('Toshkent Nonvoyxonasi','Yashil Oshxona','Mahalle Fırını','Yeşil Mutfak'))
      ON CONFLICT (seed_key) DO NOTHING`,
      [item.business_id,item.title.uz,item.description.uz,item.category,item.address.uz,item.price,item.original_price,item.quantity,item.key,item.image_key]);
  }
}
module.exports = { migrate, seed };
