// Import exchanges.sample.json into sqlite locations table directly
const fs = require('fs');
const path = require('path');
(async ()=>{
  const base = process.cwd();
  const locPath = path.resolve(base, 'data', 'exchanges.sample.json');
  if (!fs.existsSync(locPath)) { console.error('sample exchanges not found'); process.exit(2); }
   
  const mod = await import('sql.js');
  const initSqlJs = mod?.default || mod;
  const SQL = await initSqlJs({});
  const dbFile = path.resolve(base, 'history.sqlite');
  const buf = fs.existsSync(dbFile) ? fs.readFileSync(dbFile) : null;
  const db = buf ? new SQL.Database(new Uint8Array(buf)) : new SQL.Database();
  db.run('CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, name TEXT, city TEXT, lat REAL, lng REAL, provider TEXT);');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);');
  const insert = db.prepare('INSERT OR REPLACE INTO locations (id, name, city, lat, lng, provider) VALUES (?, ?, ?, ?, ?, ?)');
  const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
  data.forEach((l) => { try { insert.run([l.id, l.name, l.city, l.lat, l.lng, l.provider]); } catch { } });
  try { insert.free(); } catch { }
  fs.writeFileSync(dbFile, Buffer.from(db.export()));
  console.log('Imported sample locations into sqlite');
})();
