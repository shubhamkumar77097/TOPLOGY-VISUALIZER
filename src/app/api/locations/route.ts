import { NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/apiHelpers';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    // try reading from sqlite via sql.js unconditionally (server-side)
  // dynamically import sql.js optionally
  const mod: any = await import('sql.js');
  const initSqlJs = mod?.default || mod;
  const SQL = await initSqlJs({});
    const base = process.cwd();
    const dbPath = path.resolve(base, 'history.sqlite');
    if (fs.existsSync(dbPath)) {
      const buf = fs.readFileSync(dbPath);
      const db = new SQL.Database(new Uint8Array(buf));
      const rows = db.exec('SELECT id, name, city, lat, lng, provider, region_code FROM locations');
      if (rows && rows[0] && rows[0].values) {
        const out = rows[0].values.map((v: any[]) => ({ id: v[0], name: v[1], city: v[2], lat: v[3], lng: v[4], provider: v[5], region_code: v[6] }));
        return jsonResponse(out, req);
      }
    }
  } catch {
    // ignore and fallback
  }
  // fallback: load data/exchanges.json if present
  try {
    const base = process.cwd();
    const p = path.resolve(base, 'data', 'exchanges.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      return jsonResponse(JSON.parse(raw), req);
    }
  } catch {}
  return jsonResponse([], req);
}
