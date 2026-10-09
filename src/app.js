const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { errorPayload } = require('./errors');
const images = require('../shared/package-images.json');
const { createRateService } = require('./exchange-rates');
const fail = (status, message) => Object.assign(new Error(message), { status });
const publicUser = ({ id, name, role }) => ({ id, name, role });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sessionToken = req => req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('meal_session='))?.slice(13);
const id = value => {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw fail(400, 'invalid_id');
  return Number(value);
};
function validatePackage(body) {
  body = body || {};
  const result = {};
  for (const [key, min, max] of [['title', 3, 100], ['description', 5, 600], ['address', 5, 240]]) {
    if (typeof body[key] !== 'string' || body[key].trim().length < min || body[key].trim().length > max) throw fail(400, 'invalid_text');
    result[key] = body[key].trim();
  }
  if (!['Fırın', 'Restoran', 'Manav', 'Kafe'].includes(body.category)) throw fail(400, 'invalid_category');
  result.category = body.category;
  if (body.image_key !== undefined && body.image_key !== '' && (typeof body.image_key !== 'string' || !Object.hasOwn(images, body.image_key))) throw fail(400, 'invalid_image');
  result.image_key = body.image_key ?? null;
  for (const key of ['price', 'original_price']) {
    if (typeof body[key] !== 'number' || !Number.isFinite(body[key]) || body[key] <= 0 || body[key] > 99999999.99 || Math.abs(body[key] * 100 - Math.round(body[key] * 100)) > 0.00001) throw fail(400, 'invalid_price');
    result[key] = body[key];
  }
  if (result.price > result.original_price) throw fail(400, 'price_order');
  if (!Number.isInteger(body.quantity) || body.quantity < 0 || body.quantity > 10000) throw fail(400, 'invalid_quantity');
  result.quantity = body.quantity;
  for (const key of ['pickup_start', 'pickup_end']) {
    if (typeof body[key] !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(body[key]) || !Number.isFinite(Date.parse(body[key]))) throw fail(400, 'invalid_time');
    result[key] = new Date(body[key]).toISOString();
  }
  if (Date.parse(result.pickup_end) <= Date.now() || result.pickup_end <= result.pickup_start) throw fail(400, 'time_order');
  return result;
}
async function transaction(pool, action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
function createApp(pool, { demoEnabled = process.env.NODE_ENV !== 'production', getRates = createRateService(), trustProxy = false } = {}) {
  const app = express();
  app.set('trust proxy', trustProxy);
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}`) return next(fail(403, 'origin_denied'));
    next();
  });
  app.use(express.json({ limit: '24kb' }));
  app.use((req, res, next) => { req.body = req.body || {}; next(); });
  app.get('/api/health', async (req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'postgresql' }); });
  app.get('/api/exchange-rates', async (req, res) => res.json(await getRates()));
  app.get('/api/demo-accounts', async (req, res) => {
    if (!demoEnabled) throw fail(403, 'demo_disabled');
    res.json((await pool.query('SELECT id, name, role FROM users ORDER BY id')).rows);
  });
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
  app.post('/api/session', async (req, res) => {
    if (!demoEnabled) throw fail(403, 'demo_disabled');
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [id(req.body.user_id)])).rows[0];
    if (!user) throw fail(404, 'account_missing');
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    const oldToken = sessionToken(req);
    if (oldToken) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hash(oldToken)]);
    await pool.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [hash(token), user.id]);
    res.cookie('meal_session', token, { ...cookieOptions, maxAge: 7 * 86400000 }).json(publicUser(user));
  });
  app.use('/api', async (req, res, next) => {
    const token = sessionToken(req);
    if (token) req.user = (await pool.query('SELECT u.id, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()', [hash(token)])).rows[0];
    next();
  });
  const requireRole = role => (req, res, next) => {
    if (!req.user) return next(fail(401, 'unauthorized'));
    if (role && req.user.role !== role) return next(fail(403, 'forbidden'));
    next();
  };
  app.get('/api/session', (req, res) => res.json(req.user || null));
  app.delete('/api/session', async (req, res) => {
    const token = sessionToken(req);
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hash(token)]);
    res.clearCookie('meal_session', cookieOptions).status(204).end();
  });
  app.get('/api/packages', async (req, res) => {
    res.json((await pool.query(`SELECT p.*, u.name AS business_name FROM packages p JOIN users u ON u.id = p.business_id
      WHERE p.deleted_at IS NULL AND p.pickup_end > NOW() ORDER BY p.created_at DESC, p.id DESC`)).rows);
  });
  app.get('/api/business/packages', requireRole('business'), async (req, res) => {
    res.json((await pool.query('SELECT p.*, u.name AS business_name FROM packages p JOIN users u ON u.id=p.business_id WHERE business_id=$1 AND deleted_at IS NULL ORDER BY p.created_at DESC, p.id DESC', [req.user.id])).rows);
  });
  app.post('/api/packages', requireRole('business'), async (req, res) => {
    const p = validatePackage(req.body);
    const result = await pool.query(`INSERT INTO packages (business_id,title,description,category,address,price,original_price,quantity,pickup_start,pickup_end,image_key)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [req.user.id,p.title,p.description,p.category,p.address,p.price,p.original_price,p.quantity,p.pickup_start,p.pickup_end,p.image_key || '']);
    res.status(201).json(result.rows[0]);
  });
  app.put('/api/packages/:id', requireRole('business'), async (req, res) => {
    const packageId = id(req.params.id), p = validatePackage(req.body);
    if (!Number.isInteger(req.body.version)) throw fail(400, 'version_missing');
    res.json(await transaction(pool, async client => {
      const current = (await client.query('SELECT * FROM packages WHERE id=$1 AND business_id=$2 AND deleted_at IS NULL FOR UPDATE', [packageId, req.user.id])).rows[0];
      if (!current) throw fail(404, 'package_missing');
      if (current.version !== req.body.version) throw fail(409, 'stock_changed');
      return (await client.query(`UPDATE packages SET title=$1,description=$2,category=$3,address=$4,price=$5,original_price=$6,quantity=$7,pickup_start=$8,pickup_end=$9,image_key=COALESCE($11,image_key),version=version+1
        WHERE id=$10 RETURNING *`, [p.title,p.description,p.category,p.address,p.price,p.original_price,p.quantity,p.pickup_start,p.pickup_end,packageId,p.image_key])).rows[0];
    }));
  });
  app.delete('/api/packages/:id', requireRole('business'), async (req, res) => {
    await transaction(pool, async client => {
      const p = (await client.query('SELECT * FROM packages WHERE id=$1 AND business_id=$2 AND deleted_at IS NULL FOR UPDATE', [id(req.params.id), req.user.id])).rows[0];
      if (!p) throw fail(404, 'package_missing');
      if ((await client.query("SELECT 1 FROM reservations WHERE package_id=$1 AND status='reserved' LIMIT 1", [p.id])).rowCount) throw fail(409, 'active_reservations');
      await client.query('UPDATE packages SET deleted_at=NOW(),version=version+1 WHERE id=$1', [p.id]);
    });
    res.status(204).end();
  });
  app.post('/api/reservations', requireRole('customer'), async (req, res) => {
    const packageId = id(req.body.package_id);
    if (typeof req.body.request_key !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(req.body.request_key)) throw fail(400, 'invalid_key');
    const result = await transaction(pool, async client => {
      const p = (await client.query('SELECT * FROM packages WHERE id=$1 FOR UPDATE', [packageId])).rows[0];
      const previous = (await client.query('SELECT * FROM reservations WHERE customer_id=$1 AND request_key=$2', [req.user.id, req.body.request_key])).rows[0];
      if (previous) {
        if (previous.package_id !== packageId) throw fail(409, 'key_conflict');
        return { reservation: previous, created: false };
      }
      if (!p || p.deleted_at || new Date(p.pickup_end) <= new Date()) throw fail(404, 'package_unavailable');
      if (p.quantity < 1) throw fail(409, 'out_of_stock');
      const reservation = (await client.query(`INSERT INTO reservations (package_id,customer_id,request_key,code,price,title,business_name,address,pickup_start,pickup_end)
        VALUES ($1,$2,$3,$4,$5,$6,(SELECT name FROM users WHERE id=$7),$8,$9,$10) RETURNING *`,
        [p.id, req.user.id, req.body.request_key, crypto.randomBytes(6).toString('hex').toUpperCase(), p.price, p.title, p.business_id, p.address, p.pickup_start, p.pickup_end])).rows[0];
      await client.query('UPDATE packages SET quantity=quantity-1,version=version+1 WHERE id=$1', [p.id]);
      return { reservation, created: true };
    });
    res.status(result.created ? 201 : 200).json(result.reservation);
  });
  app.get('/api/reservations', requireRole(), async (req, res) => {
    const condition = req.user.role === 'business' ? 'p.business_id' : 'r.customer_id';
    res.json((await pool.query(`SELECT r.*, p.seed_key AS package_seed_key, u.name AS customer_name FROM reservations r JOIN packages p ON p.id=r.package_id
      JOIN users u ON u.id=r.customer_id WHERE ${condition}=$1 ORDER BY r.created_at DESC`, [req.user.id])).rows);
  });
  app.post('/api/reservations/:id/:action', requireRole(), async (req, res) => {
    const action = req.params.action;
    if (!['cancel', 'collect'].includes(action)) throw fail(404, 'action_missing');
    if (req.user.role !== (action === 'cancel' ? 'customer' : 'business')) throw fail(403, 'forbidden');
    const result = await transaction(pool, async client => {
      const preview = (await client.query('SELECT package_id FROM reservations WHERE id=$1', [id(req.params.id)])).rows[0];
      if (!preview) throw fail(404, 'reservation_missing');
      const p = (await client.query('SELECT * FROM packages WHERE id=$1 FOR UPDATE', [preview.package_id])).rows[0];
      const r = (await client.query('SELECT * FROM reservations WHERE id=$1 FOR UPDATE', [id(req.params.id)])).rows[0];
      if (action === 'cancel' ? r.customer_id !== req.user.id : p.business_id !== req.user.id) throw fail(404, 'reservation_missing');
      const target = action === 'cancel' ? 'cancelled' : 'collected';
      if (r.status === target) return r;
      if (r.status !== 'reserved') throw fail(409, 'reservation_inactive');
      if (action === 'cancel') await client.query('UPDATE packages SET quantity=quantity+1,version=version+1 WHERE id=$1', [p.id]);
      return (await client.query('UPDATE reservations SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [target,r.id])).rows[0];
    });
    res.json(result);
  });
  app.use('/api', (req, res, next) => next(fail(404, 'route_missing')));
  const dist = path.join(__dirname, '../dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else app.get('/', (req, res) => res.json({ message: 'MealLoop API tayyor. Interfeys uchun npm run dev buyrug‘ini ishga tushiring.' }));
  app.use((error, req, res, next) => {
    if (!error.status) console.error(error);
    const message = error.type === 'entity.parse.failed' || error.type === 'entity.too.large' ? 'invalid_json' : error.status ? error.message : 'server_error';
    res.status(error.status || 500).json(errorPayload(message, req.get('Accept-Language')));
  });
  return app;
}
module.exports = { createApp, validatePackage };
