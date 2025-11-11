const fs = require('fs');
const path = require('path');

const dataFile = path.resolve(process.cwd(), 'history.json');
const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf8') : '{}';
const store = JSON.parse(raw || '{}');

function flatten(store) {
  const all = [];
  Object.entries(store).forEach(([pair, arr]) => {
    (arr || []).forEach((r) => all.push({ pair, ...r }));
  });
  return all;
}

function agg({ range = '24h', bucketMsParam, pair } = {}) {
  const now = Date.now();
  let fromTs;
  switch (range) {
    case '1h': fromTs = now - 1 * 60 * 60 * 1000; break;
    case '24h': fromTs = now - 24 * 60 * 60 * 1000; break;
    case '7d': fromTs = now - 7 * 24 * 60 * 60 * 1000; break;
    case '30d': fromTs = now - 30 * 24 * 60 * 60 * 1000; break;
    default: fromTs = now - 24 * 60 * 60 * 1000;
  }
  const toTs = now;
  const span = toTs - fromTs;
  let bucketMs = bucketMsParam || (span <= 60*60*1000 ? 60*1000 : span <= 24*60*60*1000 ? 10*60*1000 : span <= 7*24*60*60*1000 ? 60*60*1000 : 6*60*60*1000);
  const start = Math.floor(fromTs / bucketMs) * bucketMs;
  const end = Math.ceil(toTs / bucketMs) * bucketMs;
  const recs = flatten(store).filter(r => (!pair || r.pair === pair) && r.ts >= fromTs && r.ts <= toTs);

  const buckets = [];
  for (let t = start; t < end; t += bucketMs) buckets.push({ start: t, end: t + bucketMs, values: [] });
  for (const r of recs) {
    const idx = Math.floor((r.ts - start) / bucketMs);
    if (idx >= 0 && idx < buckets.length) buckets[idx].values.push(Number(r.value));
  }
  const agg = buckets.map(b => {
    const vals = b.values;
    if (!vals || !vals.length) return { start: b.start, end: b.end, count: 0, min: null, max: null, avg: null };
    const sum = vals.reduce((s,v) => s + v, 0);
    return { start: b.start, end: b.end, count: vals.length, min: Math.min(...vals), max: Math.max(...vals), avg: Math.round((sum/vals.length)*100)/100 };
  });
  const allVals = recs.map(r => Number(r.value)).filter(v => !Number.isNaN(v));
  const stats = allVals.length ? { min: Math.min(...allVals), max: Math.max(...allVals), avg: Math.round((allVals.reduce((s,v) => s + v, 0)/allVals.length)*100)/100, count: allVals.length } : { min: null, max: null, avg: null, count: 0 };
  return { range, fromTs, toTs, bucketMs, stats, seriesLen: agg.length, sampleSeries: agg.slice(0,3) };
}

const ranges = ['1h','24h','7d','30d'];
for (const r of ranges) {
  const out = agg({ range: r });
  console.log('Range:', r, 'bucketMs:', out.bucketMs, 'seriesLen:', out.seriesLen, 'stats:', out.stats);
}

console.log('\nSample pair aggregation for first pair found (if any):');
const pairs = Object.keys(store);
if (pairs.length) {
  const p = pairs[0];
  const out = agg({ range: '24h', pair: p });
  console.log('pair', p, out);
} else console.log('no pairs in history.json');
