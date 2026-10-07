const fs = require('node:fs/promises');
const path = require('node:path');
const SOURCE = 'https://cbu.uz/en/arkhiv-kursov-valyut/json/';
const TTL = 60 * 60 * 1000;

function parseRates(rows, now = Date.now()) {
  if (!Array.isArray(rows)) throw new Error('Invalid CBU response');
  const entries = ['TRY','USD','RUB'].map(code => {
    const row = rows.find(item => item.Ccy === code);
    const nominal = Number(row?.Nominal), rate = Number(row?.Rate);
    if (!row || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(nominal) || nominal <= 0 || !/^\d{2}\.\d{2}\.\d{4}$/.test(row.Date)) throw new Error('Missing or invalid CBU rate: '+code);
    return { code, value:rate / nominal, date:row.Date.split('.').reverse().join('-') };
  });
  const date = entries[0].date;
  if (entries.some(entry => entry.date !== date) || !Number.isFinite(Date.parse(date)) || Date.parse(date) > now + 86400000) throw new Error('Inconsistent CBU dates');
  const [lira, dollar, ruble] = entries;
  return { base:'TRY', rates:{ TRY:1, UZS:lira.value, RUB:lira.value / ruble.value, USD:lira.value / dollar.value }, date, fetchedAt:new Date(now).toISOString(), source:SOURCE };
}
function validSnapshot(value) {
  return value?.base === 'TRY' && value.source === SOURCE && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && Number.isFinite(Date.parse(value.date)) && Number.isFinite(Date.parse(value.fetchedAt)) && ['UZS','RUB','USD'].every(code => Number.isFinite(value.rates?.[code]) && value.rates[code] > 0);
}
function createRateService({ fetchImpl = fetch, cacheFile = path.join(__dirname,'../.cache/exchange-rates.json'), now = Date.now } = {}) {
  let cached, pending, loaded = false, retryAt = 0;
  async function load() {
    if (loaded) return;
    loaded = true;
    if (!cacheFile) return;
    try { const saved = JSON.parse(await fs.readFile(cacheFile,'utf8')); if (validSnapshot(saved)) cached = saved; } catch { /* A missing cache requires a live quote. */ }
  }
  const expose = (quote, failed = false) => ({ ...quote, stale:failed || now() - Date.parse(quote.date) > 7 * 86400000 });
  return async function getRates() {
    await load();
    if (cached && now() - Date.parse(cached.fetchedAt) < TTL) return expose(cached);
    if (now() < retryAt) {
      if (cached) return expose(cached,true);
      throw Object.assign(new Error('rates_unavailable'),{status:503});
    }
    if (!pending) pending = (async () => {
      try {
        const response = await fetchImpl(SOURCE,{signal:AbortSignal.timeout(6000),headers:{Accept:'application/json'}});
        if (!response.ok) throw new Error('CBU request failed');
        const quote = parseRates(await response.json(),now());
        cached = quote;
        if (cacheFile) {
          await fs.mkdir(path.dirname(cacheFile),{recursive:true});
          await fs.writeFile(cacheFile,JSON.stringify(quote,null,2),'utf8').catch(() => {});
        }
        return expose(quote);
      } catch {
        retryAt = now()+60000;
        if (cached) return expose(cached,true);
        throw Object.assign(new Error('rates_unavailable'),{status:503});
      } finally { pending = null; }
    })();
    return pending;
  };
}
module.exports = { createRateService, parseRates };
