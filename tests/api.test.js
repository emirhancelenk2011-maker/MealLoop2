const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { fixture } = require('./helpers');
const errors = require('../shared/errors.json');
const { seed, migrate } = require('../src/database');
let env;
const cookies = {};
async function request(path, { user, body, method='GET', language='en', headers={} } = {}) {
  const response = await fetch(env.base+path, { method, headers:{ 'Content-Type':'application/json', 'Accept-Language':language, ...(user ? {Cookie:cookies[user]} : {}), ...headers }, ...(body !== undefined ? {body:JSON.stringify(body)} : {}) });
  return { status:response.status, data:response.status===204 ? null : await response.json(), response };
}
const packageBody = (overrides={}) => ({ title:'Test package', description:'Five freshly baked pastries.', category:'Fırın', address:'Test street 12', price:65, original_price:180, quantity:2, pickup_start:new Date(Date.now()-3600000).toISOString(), pickup_end:new Date(Date.now()+86400000).toISOString(), ...overrides });
const create = async body => (await request('/api/packages',{user:3,method:'POST',body:packageBody(body)})).data;
const reserve = (p,user,key=randomUUID()) => request('/api/reservations',{user,method:'POST',body:{package_id:p.id,request_key:key}});
before(async () => {
  env=await fixture();
  for (const user of [1,2,3,4]) {
    const {response}=await request('/api/session',{method:'POST',body:{user_id:user}});
    cookies[user]=response.headers.get('set-cookie').split(';')[0];
  }
});
after(async () => { if (env) await env.close(); });

test('localized API errors, default Uzbek and malformed JSON', async () => {
  for (const language of ['uz','ru','en']) {
    const result=await request('/api/reservations',{language});
    assert.equal(result.status,401); assert.equal(result.data.code,'unauthorized');
    assert.equal(result.data.error,errors.unauthorized[language]);
  }
  const defaultResponse=await fetch(env.base+'/api/reservations');
  assert.equal((await defaultResponse.json()).error,errors.unauthorized.uz);
  const invalid=await fetch(env.base+'/api/packages',{method:'POST',headers:{'Content-Type':'application/json','Accept-Language':'ru'},body:'{'});
  assert.equal(invalid.status,400); assert.equal((await invalid.json()).error,errors.invalid_json.ru);
});
test('business CRUD, ownership and validation preserve existing packages',async () => {
  const p=await create(); assert.ok(p.id);
  assert.equal((await request(`/api/packages/${p.id}`,{user:4,method:'DELETE'})).status,404);
  assert.equal((await request('/api/packages',{user:1,method:'POST',body:packageBody()})).status,403);
  assert.equal((await request('/api/packages',{user:3,method:'POST',body:packageBody({price:-1})})).status,400);
  const edit=await request(`/api/packages/${p.id}`,{user:3,method:'PUT',body:{...packageBody({title:'Updated package'}),version:p.version}});
  assert.equal(edit.status,200); assert.equal(edit.data.title,'Updated package');
  assert.equal((await request(`/api/packages/${p.id}`,{user:3,method:'DELETE'})).status,204);
  const all=await request('/api/packages'); assert.ok(!all.data.some(item=>item.id===p.id));
  assert.ok(all.data.some(item=>item.seed_key==='demo-0'));
});
test('two simultaneous customers cannot reserve the last package',async () => {
  const p=await create({quantity:1});
  const results=await Promise.all([reserve(p,1),reserve(p,2)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  assert.equal((await env.pool.query('SELECT quantity FROM packages WHERE id=$1',[p.id])).rows[0].quantity,0);
  assert.equal((await env.pool.query('SELECT * FROM reservations WHERE package_id=$1',[p.id])).rowCount,1);
});
test('retry key and repeated cancellation do not change stock twice',async () => {
  const p=await create({quantity:2}); const key=randomUUID();
  const results=await Promise.all([reserve(p,1,key),reserve(p,1,key)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,201]); assert.equal(results[0].data.id,results[1].data.id);
  const r=results[0].data;
  assert.equal((await request(`/api/reservations/${r.id}/cancel`,{user:2,method:'POST'})).status,404);
  const cancelled=await Promise.all([request(`/api/reservations/${r.id}/cancel`,{user:1,method:'POST'}),request(`/api/reservations/${r.id}/cancel`,{user:1,method:'POST'})]);
  assert.ok(cancelled.every(x=>x.status===200));
  assert.equal((await env.pool.query('SELECT quantity FROM packages WHERE id=$1',[p.id])).rows[0].quantity,2);
});
test('stale editing is rejected; active reservations block deletion; pickup keeps its price',async () => {
  const p=await create({quantity:3}); const r=(await reserve(p,1)).data;
  const stale=await request(`/api/packages/${p.id}`,{user:3,method:'PUT',body:{...packageBody(),version:p.version}});
  assert.equal(stale.status,409); assert.equal(stale.data.code,'stock_changed');
  assert.equal((await request(`/api/packages/${p.id}`,{user:3,method:'DELETE'})).status,409);
  const current=(await env.pool.query('SELECT * FROM packages WHERE id=$1',[p.id])).rows[0];
  const edited=await request(`/api/packages/${p.id}`,{user:3,method:'PUT',body:{...packageBody({price:90,quantity:2}),version:current.version}});
  assert.equal(edited.status,200);
  assert.equal((await request(`/api/reservations/${r.id}/collect`,{user:4,method:'POST'})).status,404);
  const collected=await request(`/api/reservations/${r.id}/collect`,{user:3,method:'POST'});
  assert.equal(collected.data.status,'collected'); assert.equal(Number(collected.data.price),65);
  assert.equal((await request(`/api/reservations/${r.id}/cancel`,{user:1,method:'POST'})).status,409);
  assert.equal((await request(`/api/packages/${p.id}`,{user:3,method:'DELETE'})).status,204);
  const history=await request('/api/reservations',{user:1}); assert.ok(history.data.some(x=>x.id===r.id));
});
test('expired packages and foreign origins are rejected',async () => {
  const p=await create();
  await env.pool.query("UPDATE packages SET pickup_start=NOW()-INTERVAL '2 hours',pickup_end=NOW()-INTERVAL '1 hour' WHERE id=$1",[p.id]);
  assert.equal((await reserve(p,1)).status,404);
  const result=await request('/api/session',{method:'POST',body:{user_id:1},headers:{Origin:'https://other.example'}});
  assert.equal(result.status,403); assert.equal(result.data.code,'origin_denied');
});

test('UZS prices, explicit pickup offsets and photo choices survive CRUD', async () => {
  const p = await create({ price:125000.50, original_price:240000, image_key:'salad', pickup_start:'2030-10-07T18:00:00+05:00', pickup_end:'2030-10-07T20:00:00+05:00' });
  assert.equal(p.price,'125000.50');
  assert.equal(p.image_key,'salad');
  assert.equal(p.pickup_start,'2030-10-07T13:00:00.000Z');
  const edit = await request(`/api/packages/${p.id}`,{user:3,method:'PUT',body:{...packageBody({price:125000.50,original_price:240000}),version:p.version}});
  assert.equal(edit.data.image_key,'salad'); // Older clients can omit the new field.
  for (const [body, code] of [[{image_key:'https://invalid.example/photo.jpg'},'invalid_image'],[{pickup_start:'2030-10-07T18:00'},'invalid_time'],[{price:100000000,original_price:100000000},'invalid_price']]) {
    const result = await request('/api/packages',{user:3,method:'POST',body:packageBody(body),language:'ru'});
    assert.equal(result.status,400); assert.equal(result.data.code,code); assert.equal(result.data.error,errors[code].ru);
  }
});

test('migrations and reseeding preserve edited packages and reservation snapshots', async () => {
  const original = (await env.pool.query("SELECT * FROM packages WHERE seed_key='demo-0'")).rows[0];
  const before = await request(`/api/packages/${original.id}`,{user:3,method:'PUT',body:{...packageBody({title:'Kullanıcının kendi başlığı',description:'Kullanıcının kendi açıklaması',address:'Özel adres korunmalı',price:43210.25,original_price:90000,quantity:7}),version:original.version}});
  assert.equal(before.status,200);
  const reservation = (await reserve(before.data,1)).data;
  const packages = (await env.pool.query('SELECT * FROM packages ORDER BY id')).rows;
  const users = (await env.pool.query('SELECT * FROM users ORDER BY id')).rows;
  await migrate(env.pool); await seed(env.pool);
  assert.deepEqual((await env.pool.query('SELECT * FROM packages ORDER BY id')).rows,packages);
  assert.deepEqual((await env.pool.query('SELECT * FROM users ORDER BY id')).rows,users);
  const history = await request('/api/reservations',{user:1});
  const saved = history.data.find(item => item.id === reservation.id);
  for (const field of ['title','address','price','pickup_start','pickup_end']) assert.equal(saved[field],reservation[field]);
});
