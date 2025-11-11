// Standalone repair script: attempts to create `history` table in history.sqlite and import history.json
// Run with: node scripts/repair-sqlite.js
const fs = require('fs');
const path = require('path');
(async function main(){
  const base = process.cwd();
  const j = path.resolve(base, 'history.json');
  const s = path.resolve(base, 'history.sqlite');
  console.log('repair-sqlite: base=', base);
  try {
  // dynamically import sql.js so it's optional at runtime
  const mod = await import('sql.js');
  const initSqlJs = mod?.default || mod;
  const SQL = await initSqlJs({});
    let db;
    if (fs.existsSync(s)) {
      const buf = fs.readFileSync(s);
      db = new SQL.Database(new Uint8Array(buf));
      console.log('Loaded existing history.sqlite');
    } else {
      db = new SQL.Database();
      console.log('Created new in-memory sqlite DB');
    }

  // Ensure table exists
    db.run(`CREATE TABLE IF NOT EXISTS history (
      pair TEXT,
      from_id TEXT,
      to_id TEXT,
      value REAL,
      ts INTEGER
    );`);
  try { db.run("ALTER TABLE locations ADD COLUMN region_code TEXT;"); } catch { /* ignore if exists or no table */ }
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);'); } catch { }

    // If table was empty and history.json exists, import
    let count = 0;
    try {
      const rows = db.exec('SELECT COUNT(*) as c FROM history');
      count = rows && rows[0] && rows[0].values && rows[0].values[0] && rows[0].values[0][0] ? rows[0].values[0][0] : 0;
    } catch (e) { console.log('count check failed:', e); }

    if (count === 0 && fs.existsSync(j)) {
      try {
        const raw = fs.readFileSync(j, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        // dedupe by pair+ts so we don't insert duplicates
        const seen = new Set();
  const insert = db.prepare('INSERT OR IGNORE INTO history (pair, from_id, to_id, value, ts) VALUES (?, ?, ?, ?, ?)');
        Object.keys(parsed).forEach((pair) => {
          const arr = parsed[pair];
          if (Array.isArray(arr)) {
            arr.forEach((r) => {
              const ts = Number(r.ts || 0);
              const key = `${pair}::${ts}`;
              if (seen.has(key)) return;
              seen.add(key);
              try { insert.run([pair, r.from || r.from_id || r['from'], r.to || r.to_id || r['to'], r.value, ts]); } catch { }
            });
          }
        });
  try { insert.free(); } catch { }
        console.log('Imported history.json into sqlite in-memory DB (deduped)');
  } catch (e) { console.log('Import failed:', e); }
    }

    // Persist
    try {
      const data = db.export();
      fs.writeFileSync(s, Buffer.from(data));
      console.log('Wrote repaired sqlite to', s);
      const fresh = new SQL.Database(new Uint8Array(fs.readFileSync(s)));
      const rows2 = fresh.exec('SELECT COUNT(*) as c FROM history');
      const newCount = rows2 && rows2[0] && rows2[0].values && rows2[0].values[0] && rows2[0].values[0][0] ? rows2[0].values[0][0] : 0;
      console.log('Final sqlite count:', newCount);
  } catch (e) { console.log('Persist failed:', e); }
  } catch (e) {
    console.error('sql.js not available or error:', e);
    process.exitCode = 2;
  }
})();
