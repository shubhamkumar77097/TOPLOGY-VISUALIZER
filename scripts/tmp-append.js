(async()=>{
  const fs = require('fs');
  const initSqlJs = eval('require')('sql.js');
  const SQL = await initSqlJs();
  const dbFile = 'history.sqlite';
  const buf = fs.readFileSync(dbFile);
  const db = new SQL.Database(new Uint8Array(buf));
  db.run('CREATE TABLE IF NOT EXISTS history (pair TEXT, from_id TEXT, to_id TEXT, value REAL, ts INTEGER);');
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);'); } catch { }
  const pair = 'binance-aws-tokyo->deribit-gcp-netherlands';
  const ts = Date.now();
  try {
    const st = db.prepare('INSERT OR IGNORE INTO history (pair, from_id, to_id, value, ts) VALUES (?,?,?,?,?)');
    st.run([pair, 'binance-aws-tokyo', 'deribit-gcp-netherlands', 123, ts]);
    st.free();
  } catch (e) { console.error('insert failed', e); }
  const rows = db.exec(`SELECT pair, from_id, to_id, value, ts FROM history WHERE pair='${pair.replace(/'/g, "''")}' ORDER BY ts ASC`);
  console.log(JSON.stringify(rows[0]?.values || [], null, 2));
  const out = db.export();
  fs.writeFileSync(dbFile, Buffer.from(out));
})();
