const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServerlessHandler } = require('../src/serverless');

async function serve(t, handler) {
  const server = http.createServer(handler).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('serverless requests share initialization and preserve API paths', async t => {
  let starts = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const pool = { query: async () => ({ rows: [] }) };
  const handler = createServerlessHandler(pool, { initialize: async () => { starts++; await gate; } });
  let arrivals = 0;
  const base = await serve(t, (req, res) => {
    if (++arrivals === 2) release();
    return handler(req, res);
  });
  const health = fetch(`${base}/api/health`);
  const packages = fetch(`${base}/api/packages`);
  assert.deepEqual(await (await health).json(), { status: 'ok', database: 'postgresql' });
  assert.deepEqual(await (await packages).json(), []);
  assert.equal(starts, 1);
  const unknown = await fetch(`${base}/api/not-a-route`);
  assert.equal(unknown.status, 404);
  assert.equal((await unknown.json()).code, 'route_missing');
});

test('failed database initialization returns JSON and retries on the next request', async t => {
  let attempts = 0;
  t.mock.method(console, 'error', () => {});
  const base = await serve(t, createServerlessHandler({ query: async () => ({ rows: [] }) }, {
    initialize: async () => { if (++attempts === 1) throw Object.assign(new Error('offline'), { code: 'ECONNREFUSED' }); },
  }));
  const failed = await fetch(`${base}/api/health`, { headers: { 'Accept-Language': 'en' } });
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('cache-control'), 'no-store');
  assert.equal((await failed.json()).code, 'server_error');
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal(attempts, 2);
});

test('HTTPS requests behind the Vercel proxy pass origin validation; foreign origins fail', async t => {
  const pool = { query: async () => ({ rows: [] }) };
  const base = await serve(t, createServerlessHandler(pool, { initialize: async () => {}, trustProxy: 1 }));
  const headers = { 'X-Forwarded-Proto': 'https', Origin: base.replace('http:', 'https:') };
  assert.equal((await fetch(`${base}/api/session`, { method: 'DELETE', headers })).status, 204);
  const foreign = await fetch(`${base}/api/session`, { method: 'DELETE', headers: { ...headers, Origin: 'https://other.example' } });
  assert.equal(foreign.status, 403);
  assert.equal((await foreign.json()).code, 'origin_denied');
  const local = await serve(t, createServerlessHandler(pool, { initialize: async () => {} }));
  assert.equal((await fetch(`${local}/api/session`, {
    method: 'DELETE', headers: { ...headers, Origin: local.replace('http:', 'https:') },
  })).status, 403);
});

test('production keeps demo account selection disabled', async t => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
  const base = await serve(t, createServerlessHandler({ query: async () => ({ rows: [] }) }, { initialize: async () => {} }));
  const result = await fetch(`${base}/api/demo-accounts`);
  assert.equal(result.status, 403);
  assert.equal((await result.json()).code, 'demo_disabled');
});

test('Vercel entry point reports a missing DATABASE_URL without trying a local database', async t => {
  const original = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  t.after(() => { if (original === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = original; });
  const log = t.mock.method(console, 'error', () => {});
  const base = await serve(t, require('../api/index'));
  const result = await fetch(`${base}/api/health`, { headers: { 'Accept-Language': 'en' } });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await result.json()).code, 'server_error');
  assert.match(log.mock.calls[0].arguments[0], /Set DATABASE_URL/);
});
