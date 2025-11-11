import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Accept either single assignment {id, region} or { assignments: [{id, region}, ...] }
    let assignments = [] as Array<{ id: string; region: string }>;
    if (Array.isArray(body)) assignments = body;
    else if (body.assignments && Array.isArray(body.assignments)) assignments = body.assignments;
    else if (body && body.id) assignments = [{ id: body.id, region: body.region }];
    if (assignments.length === 0) return NextResponse.json({ ok: false, error: 'missing assignments' }, { status: 400 });

    const base = process.cwd();
    // try sqlite-wasm adapter if available
    const dbPath = path.resolve(base, 'history.sqlite');
    // Try sqlite via sql.js first (reads file, updates rows, writes back the file)
    try {
      const mod: any = await import('sql.js');
      const initSqlJs = mod?.default || mod;
      const SQL = await initSqlJs();
      if (fs.existsSync(dbPath)) {
        const buf = fs.readFileSync(dbPath);
        const db = new SQL.Database(new Uint8Array(buf));
        const st = db.prepare('UPDATE locations SET region_code = ? WHERE id = ?');
        for (const a of assignments) {
          try {
            st.run([a.region, a.id]);
          } catch {
            /* ignore per-row failures */
          }
        }
        st.free();
        const out = db.export();
        fs.writeFileSync(dbPath, Buffer.from(out));
        return NextResponse.json({ ok: true, applied: assignments.length });
      }
    } catch {
      // ignore sql.js unavailability
    }

    // fallback: update data/exchanges.json if exists
    try {
      const p = path.resolve(base, 'data', 'exchanges.json');
      if (fs.existsSync(p)) {
        const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
        let modified = 0;
        for (const a of assignments) {
          for (const item of arr) {
            if (item.id === a.id) {
              item.region_code = a.region;
              modified++;
            }
          }
        }
        if (modified) fs.writeFileSync(p, JSON.stringify(arr, null, 2));
        return NextResponse.json({ ok: true, applied: modified });
      }
    } catch {
      // ignore fallback errors
    }

    return NextResponse.json({ ok: false, error: 'no db or data file' }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
