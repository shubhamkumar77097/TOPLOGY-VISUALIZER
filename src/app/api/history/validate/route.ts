import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const base = process.cwd();
    const j = path.resolve(base, 'history.json');
    const s = path.resolve(base, 'history.sqlite');
    const resp: any = { jsonExists: fs.existsSync(j), sqliteExists: fs.existsSync(s) };
    if (resp.jsonExists) {
      try {
        const raw = fs.readFileSync(j, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        resp.jsonPairs = Object.keys(parsed).length;
  } catch (e) { resp.jsonError = String(e); }
    }
    if (resp.sqliteExists) {
      try {
        // load sql.js dynamically
  // dynamically import sql.js so it's optional at runtime
  const mod: any = await import('sql.js');
  const initSqlJs = mod?.default || mod;
  const SQL = await initSqlJs({});
        const buf = fs.readFileSync(s);
        const db = new SQL.Database(new Uint8Array(buf));
        try {
          const rows = db.exec('SELECT COUNT(*) as c FROM history');
          resp.sqliteCount = (rows && rows[0] && rows[0].values && rows[0].values[0] && rows[0].values[0][0]) || 0;
          } catch {
            // Table may be missing or schema incompatible. Attempt auto-repair:
            resp.sqliteRepairAttempt = 'table-missing-or-incompatible';
            try {
            // Create a proper history table if it doesn't exist
            db.run(
              `CREATE TABLE IF NOT EXISTS history (
                pair TEXT,
                from_id TEXT,
                to_id TEXT,
                value REAL,
                ts INTEGER
              );`
            );

            // If history.json exists, try importing its contents to seed the sqlite DB
            if (resp.jsonExists) {
              try {
                const raw = fs.readFileSync(j, 'utf8');
                const parsed = JSON.parse(raw || '{}');
                // dedupe set: pair+ts and use DB-level insert-or-ignore where available
                const seen = new Set();
                try { db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_pair_ts ON history(pair, ts);'); } catch { }
                const insert = db.prepare('INSERT OR IGNORE INTO history (pair, from_id, to_id, value, ts) VALUES (?, ?, ?, ?, ?)');
        Object.keys(parsed).forEach((pair) => {
                  const arr = parsed[pair];
                    if (Array.isArray(arr)) {
                    arr.forEach((r: any) => {
          const ts = Number(r.ts || 0);
          const key = `${pair}::${ts}`;
          if (seen.has(key)) return;
          seen.add(key);
          try { insert.run([pair, r.from || r.from_id || r['from'], r.to || r.to_id || r['to'], r.value, ts]); } catch { }
                    });
                  }
                });
        try { insert.free(); } catch { }
              } catch (impE) {
                // ignore import errors but surface them
                resp.sqliteImportError = String(impE);
              }
            }

            // Persist repaired DB back to disk
            try {
              const data = db.export();
              fs.writeFileSync(s, Buffer.from(data));
              // re-open to get accurate count
              const fresh = new SQL.Database(new Uint8Array(fs.readFileSync(s)));
              const rows2 = fresh.exec('SELECT COUNT(*) as c FROM history');
              resp.sqliteCount = (rows2 && rows2[0] && rows2[0].values && rows2[0].values[0] && rows2[0].values[0][0]) || 0;
              resp.sqliteFixed = true;
            } catch (persistErr) {
              resp.sqlitePersistError = String(persistErr);
            }
          } catch (repairErr) {
            resp.sqliteRepairError = String(repairErr);
          }
        }
      } catch (e) {
        resp.sqliteError = String(e);
      }
    }
    // create backups
    const now = Date.now();
    if (resp.jsonExists) fs.copyFileSync(j, `${j}.bak.${now}`);
    if (resp.sqliteExists) fs.copyFileSync(s, `${s}.bak.${now}`);
    return NextResponse.json({ ok: true, info: resp });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
