// Lightweight sqlite-wasm adapter using sql.js (loaded at runtime)
// This adapter is optional and selected when process.env.USE_WASM_SQLITE === '1'
import fs from 'fs';
import path from 'path';

type Rec = { from: string; to: string; value: number; ts: number };

const DB_FILE = path.resolve(process.cwd(), 'history.sqlite');

let SQL: any = null;
let db: any = null;

async function init() {
  if (db) return;
  if (!SQL) {
    // load sql.js dynamically to avoid bundling wasm into server-side build when unused.
    // Use dynamic import so bundlers treat this as optional and TypeScript stays happy.
    try {
      const mod: any = await import('sql.js');
      const initSqlJs = mod?.default || mod;
      SQL = await initSqlJs({});
    } catch {
      throw new Error('sql.js not available; install sql.js to use WASM sqlite adapter');
    }
  }

  if (fs.existsSync(DB_FILE)) {
    const buf = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(buf));
  } else {
    db = new SQL.Database();
  }

  // create table if missing
  db.run(
    `CREATE TABLE IF NOT EXISTS history (
      pair TEXT,
      from_id TEXT,
      to_id TEXT,
      value REAL,
      ts INTEGER
    );`
  );

  // ensure unique index to dedupe by pair+ts
  try {
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);');
  } catch {
    // ignore
  }
  // create locations table if missing
  try {
    db.run(`CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      lat REAL,
      lng REAL,
      provider TEXT,
      region_code TEXT
    );`);
  } catch {}
  try { db.run('CREATE INDEX IF NOT EXISTS idx_locations_provider ON locations(provider);'); } catch {}

  // handle legacy column names (some older versions used `from` and `to`) by migrating safely
  try {
    const info = db.exec("PRAGMA table_info('history')");
    const cols: string[] = [];
    if (info && info[0] && info[0].values) {
      info[0].values.forEach((v: any[]) => cols.push(v[1]));
    }
    if (cols.length && (cols.includes('from') || cols.includes('to')) && (!cols.includes('from_id') || !cols.includes('to_id'))) {
      // perform safe migration: create a new table and copy values using COALESCE to handle missing names
      db.run(`CREATE TABLE IF NOT EXISTS history_new (pair TEXT, from_id TEXT, to_id TEXT, value REAL, ts INTEGER);`);
      db.run(`INSERT INTO history_new (pair, from_id, to_id, value, ts)
        SELECT pair, COALESCE(from_id, "from"), COALESCE(to_id, "to"), value, ts FROM history;`);
      db.run('DROP TABLE history;');
      db.run('ALTER TABLE history_new RENAME TO history;');
    }
  } catch {
    // ignore schema normalization errors
  }
}

export async function appendRecordSql(pair: string, rec: Rec) {
  await init();
  // Try several insert strategies to support both modern and legacy schemas.
  const tryRun = (sql: string, params: any[]) => {
    try {
      const st = db.prepare(sql);
      st.run(params);
      st.free();
      return true;
    } catch {
      return false;
    }
  };

  // Preferred modern schema
  if (tryRun('INSERT OR IGNORE INTO history (pair, from_id, to_id, value, ts) VALUES (?, ?, ?, ?, ?)', [pair, rec.from, rec.to, rec.value, rec.ts])) return;
  // Legacy quoted column names
  if (tryRun('INSERT OR IGNORE INTO history (pair, "from", "to", value, ts) VALUES (?, ?, ?, ?, ?)', [pair, rec.from, rec.to, rec.value, rec.ts])) return;

  // If neither worked, attempt to create the modern schema and migrate data safely
  try {
    // create temporary table if missing
    db.run('CREATE TABLE IF NOT EXISTS history_new (pair TEXT, from_id TEXT, to_id TEXT, value REAL, ts INTEGER);');
    // Try to copy existing values into history_new using COALESCE to prefer _id columns when present
    try {
      db.run("INSERT INTO history_new (pair, from_id, to_id, value, ts) SELECT pair, COALESCE(from_id, \"from\"), COALESCE(to_id, \"to\"), value, ts FROM history;");
      db.run('DROP TABLE IF EXISTS history;');
      db.run('ALTER TABLE history_new RENAME TO history;');
    // ensure unique index exists after migration
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);'); } catch { }
    } catch {
      // If the copy fails because history doesn't exist, simply ensure history table exists
      db.run('CREATE TABLE IF NOT EXISTS history (pair TEXT, from_id TEXT, to_id TEXT, value REAL, ts INTEGER);');
  try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);'); } catch { }
    }
    // Try insert again into newly ensured schema
  if (tryRun('INSERT OR IGNORE INTO history (pair, from_id, to_id, value, ts) VALUES (?, ?, ?, ?, ?)', [pair, rec.from, rec.to, rec.value, rec.ts])) return;
  } catch {
    // swallow and continue to throw below
  }

  throw new Error('Failed to append record: sqlite history table has incompatible schema');
  // simple pruning per pair keep last 500
  const keep = 500;
  const res = db.exec('SELECT COUNT(*) as c FROM history WHERE pair = ?',{ bind: [pair] });
  // if exec doesn't support bind (older SQL.js), run fallback
  let count = 0;
  try {
    count = res[0]?.values?.[0]?.[0] ?? 0;
  } catch {
    const r = db.exec(`SELECT COUNT(*) as c FROM history WHERE pair = '${pair.replace(/'/g,"''")}'`);
    count = r[0]?.values?.[0]?.[0] ?? 0;
  }
  if (count > keep) {
    db.run(`DELETE FROM history WHERE rowid IN (
      SELECT rowid FROM history WHERE pair = '${pair.replace(/'/g,"''")}' ORDER BY ts ASC LIMIT ${count - keep}
    )`);
  }
  persist();
}

export async function queryRecordsSql(pair?: string, fromTs?: number, toTs?: number) {
  await init();
  // If table doesn't exist, return empty
  try {
    const info = db.exec("PRAGMA table_info('history')");
    if (!info || !info[0] || !info[0].values || info[0].values.length === 0) {
      return [];
    }
  } catch {
    return [];
  }

  const clauses: string[] = [];
  if (pair) clauses.push(`pair = '${pair.replace(/'/g,"''")}'`);
  if (typeof fromTs === 'number') clauses.push(`ts >= ${Number(fromTs)}`);
  if (typeof toTs === 'number') clauses.push(`ts <= ${Number(toTs)}`);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.exec(`SELECT pair, from_id, to_id, value, ts FROM history ${where} ORDER BY ts ASC`);
  const out: any[] = [];
  if (rows && rows.length) {
    const cols = rows[0].columns;
    rows[0].values.forEach((vals: any[]) => {
      const obj: any = {};
      cols.forEach((c: string, i: number) => (obj[c] = vals[i]));
      out.push(obj);
    });
  }
  return out;
}

export function persist() {
  if (!db || !SQL) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

export async function getAllPairsSql() {
  await init();
  const rows = db.exec('SELECT DISTINCT pair FROM history');
  const out: string[] = [];
  if (rows && rows.length) {
    rows[0].values.forEach((v: any[]) => out.push(v[0]));
  }
  return out;
}

export async function getAllLocationsSql() {
  await init();
  try {
    const rows = db.exec('SELECT id, name, city, lat, lng, provider FROM locations');
    const out: any[] = [];
    if (rows && rows[0] && rows[0].values) {
      rows[0].values.forEach((v: any[]) => out.push({ id: v[0], name: v[1], city: v[2], lat: v[3], lng: v[4], provider: v[5] }));
    }
    return out;
  } catch { return []; }
}

export function insertLocationSql(loc: { id: string; name: string; city: string; lat: number; lng: number; provider: string }) {
  if (!db) return;
  try {
    const st = db.prepare('INSERT OR REPLACE INTO locations (id, name, city, lat, lng, provider, region_code) VALUES (?, ?, ?, ?, ?, ?, ?)');
    st.run([loc.id, loc.name, loc.city, loc.lat, loc.lng, loc.provider, (loc as any).region_code || null]);
    st.free();
  } catch {
    // ignore
  }
}

export function updateLocationRegionSql(id: string, regionCode: string | null) {
  if (!db) return;
  try {
    const st = db.prepare('UPDATE locations SET region_code = ? WHERE id = ?');
    st.run([regionCode, id]);
    st.free();
  } catch {}
}

// Delete rows by rowid (used for pruning)
export function dbRunPrune(rowids: number[]) {
  if (!db) return;
  const ids = rowids.map((i) => Number(i)).filter(Boolean);
  if (!ids.length) return;
  const inList = ids.join(',');
  db.run(`DELETE FROM history WHERE rowid IN (${inList})`);
  persist();
}
