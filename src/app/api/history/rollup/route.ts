import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
  // accept pair in either 'from->to' or 'from__to' formats
  let pair = url.searchParams.get('pair');
  if (pair && pair.includes('__')) pair = pair.replace(/__/g, '->');
    const fromTs = url.searchParams.get('from') ? Number(url.searchParams.get('from')) : undefined;
    const toTs = url.searchParams.get('to') ? Number(url.searchParams.get('to')) : undefined;
    if (!pair) return NextResponse.json({ ok: false, error: 'missing pair' }, { status: 400 });
    const base = process.cwd();
    // try sqlite
    try {
      const mod: any = await import('sql.js');
      const initSqlJs = mod?.default || mod;
      const SQL = await initSqlJs();
      const dbPath = path.resolve(base, 'history.sqlite');
      if (fs.existsSync(dbPath)) {
        const buf = fs.readFileSync(dbPath);
        const db = new SQL.Database(new Uint8Array(buf));
        const clauses = [`pair = '${pair.replace(/'/g, "''")}'`];
        if (fromTs) clauses.push(`ts >= ${Number(fromTs)}`);
        if (toTs) clauses.push(`ts <= ${Number(toTs)}`);
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const rows = db.exec(`SELECT MIN(value), MAX(value), AVG(value), COUNT(*) FROM history ${where}`);
        if (rows && rows[0] && rows[0].values && rows[0].values[0]) {
          const v = rows[0].values[0];
          // if sqlite reports a non-zero count return it
          if (v[3] && Number(v[3]) > 0) return NextResponse.json({ ok: true, min: v[0], max: v[1], avg: v[2], count: v[3] });
          // otherwise, fall through and consult history.json below
        }
        // fall through to json fallback if sqlite had no data for this pair
      }
    } catch { 
      // fallback
    }

    // fallback to history.json (support either keyed map { pair: [...] } or flat array)
    try {
      const p = path.resolve(base, 'history.json');
      if (!fs.existsSync(p)) return NextResponse.json({ ok: true, min: null, max: null, avg: null, count: 0 });
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      let filtered: any[] = [];
      if (Array.isArray(raw)) {
        filtered = raw.filter((r:any)=>r.pair===pair && (fromTs? r.ts>=fromTs : true) && (toTs? r.ts<=toTs : true));
      } else if (raw && typeof raw === 'object') {
        const arr = raw[pair] || [];
        filtered = arr.filter((r:any)=> (fromTs? r.ts>=fromTs : true) && (toTs? r.ts<=toTs : true));
      }
      if (!filtered.length) return NextResponse.json({ ok: true, min:null, max:null, avg:null, count: 0 });
      const vals = filtered.map((f:any)=>f.value);
      const min = Math.min(...vals); const max = Math.max(...vals); const avg = vals.reduce((a:number,b:number)=>a+b,0)/vals.length;
      return NextResponse.json({ ok: true, min, max, avg, count: vals.length });
  } catch { }

    return NextResponse.json({ ok: true, min: null, max: null, avg: null, count: 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
