#!/usr/bin/env node
/*
Compute rollups from history.sqlite into a lightweight rollup table.
Creates hourly and daily aggregates (min,max,avg,count) per pair.
*/
(async ()=>{
  try{
    const path = require('path');
    const fs = require('fs');
    const base = process.cwd();
    const dbPath = path.resolve(base, 'history.sqlite');
    if (!fs.existsSync(dbPath)) { console.error('No history.sqlite found, skipping'); process.exit(0); }
    const initSqlJs = require('sql.js');
    const SQL = await (initSqlJs.default || initSqlJs)();
    const buf = fs.readFileSync(dbPath);
    const db = new SQL.Database(new Uint8Array(buf));
    // ensure rollup table exists
    try { db.run(`CREATE TABLE IF NOT EXISTS rollups (pair TEXT, period TEXT, bucket INTEGER, min REAL, max REAL, avg REAL, count INTEGER, PRIMARY KEY(pair, period, bucket));`); } catch(e){console.error(e)}
    // compute hourly rollups for last 30 days
    const now = Date.now();
    const dayMs = 24*60*60*1000;
    const start = now - (30*dayMs);
    // fetch distinct pairs
    const pairsRes = db.exec('SELECT DISTINCT pair FROM history');
    const pairs = (pairsRes && pairsRes[0] && pairsRes[0].values) ? pairsRes[0].values.map((r)=>r[0]) : [];
    for (const p of pairs) {
      // hourly
      for (let t = start; t < now; t += 60*60*1000) {
        const bucketStart = Math.floor(t / (60*60*1000)) * (60*60*1000);
        const q = `SELECT MIN(value), MAX(value), AVG(value), COUNT(*) FROM history WHERE pair='${p.replace(/'/g,"''")}' AND ts >= ${bucketStart} AND ts < ${bucketStart + 60*60*1000}`;
        const rows = db.exec(q);
        if (rows && rows[0] && rows[0].values && rows[0].values[0]) {
          const [min,max,avg,count] = rows[0].values[0];
          if (count && count>0) {
            db.run(`INSERT OR REPLACE INTO rollups (pair, period, bucket, min, max, avg, count) VALUES (?, 'hour', ?, ?, ?, ?, ?)`, [p, bucketStart, min, max, avg, count]);
          }
        }
      }
      // daily rollups
      for (let t = start; t < now; t += dayMs) {
        const bucketStart = Math.floor(t / dayMs) * dayMs;
        const q = `SELECT MIN(value), MAX(value), AVG(value), COUNT(*) FROM history WHERE pair='${p.replace(/'/g,"''")}' AND ts >= ${bucketStart} AND ts < ${bucketStart + dayMs}`;
        const rows = db.exec(q);
        if (rows && rows[0] && rows[0].values && rows[0].values[0]) {
          const [min,max,avg,count] = rows[0].values[0];
          if (count && count>0) {
            db.run(`INSERT OR REPLACE INTO rollups (pair, period, bucket, min, max, avg, count) VALUES (?, 'day', ?, ?, ?, ?, ?)`, [p, bucketStart, min, max, avg, count]);
          }
        }
      }
    }
    const out = db.export();
    fs.writeFileSync(dbPath, Buffer.from(out));
    console.log('Rollups computed');
  }catch(e){ console.error('Rollup worker error', e); process.exit(1); }
})();
