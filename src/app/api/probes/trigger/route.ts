import { NextResponse } from 'next/server';
import path from 'path';

// Trigger a single probe for a given pair or between two ids. Returns records.
export async function POST(req: Request) {
  try {
    // auth token check
    const secret = process.env.PROBE_SECRET || process.env.NEXT_PUBLIC_PROBE_SECRET;
    if (secret) {
      const hdr = (req.headers && (req.headers as any).get && (req.headers as any).get('x-tv-auth')) || '';
      if (!hdr || String(hdr) !== String(secret)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    // simple in-memory rate limit per IP
    const RATE: any = (globalThis as any).__probe_trigger_rate = (globalThis as any).__probe_trigger_rate || { byIp: new Map(), limit: 10, period: 60 * 1000 };
    try {
      const ip = (req.headers && (req.headers as any).get && (req.headers as any).get('x-forwarded-for')) || 'local';
      const nowt = Date.now();
      const entry = RATE.byIp.get(ip) || { ts: nowt, count: 0 };
      if (nowt - entry.ts > RATE.period) { entry.ts = nowt; entry.count = 0; }
      entry.count += 1;
      RATE.byIp.set(ip, entry);
      if (entry.count > RATE.limit) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    } catch {}
    const body = await req.json();
  const from = body.from; const to = body.to; let pair = body.pair;
    // resolve pair format
    if (!pair && from && to) pair = `${from}->${to}`;
    if (!pair) return NextResponse.json({ ok: false, error: 'pair or from+to required' }, { status: 400 });

    // load locations
    const modPath = path.resolve(process.cwd(), 'src/data/locations.ts');
    let locs: any[] = [];
    try {
      const l = eval('require')(modPath);
      locs = l && l.locations ? l.locations : l.default || l;
    } catch {
      try { locs = eval('require')(path.resolve(process.cwd(), 'data', 'exchanges.json')); } catch { locs = []; }
    }

    const [f, t] = pair.split('->');
    const a = (locs || []).find((x:any)=>x.id === f) || { id: f, url: 'https://www.google.com/generate_204' };
    const b = (locs || []).find((x:any)=>x.id === t) || { id: t, url: 'https://www.google.com/generate_204' };

    const now = () => Date.now();
    const resRecs: any[] = [];

    try {
      const t0 = now();
      await fetch(b.url || 'https://www.google.com/generate_204', { method: 'GET' });
      const t1 = now();
      const rec = { from: a.id, to: b.id, value: t1 - t0, ts: t1 };
      resRecs.push({ pair: `${a.id}->${b.id}`, rec });
      // persist if possible
      try { const hs = await import('@/lib/historyStore'); await hs.appendRecord(`${a.id}->${b.id}`, rec); } catch {}
    } catch {}

    try {
      const t2 = now();
      await fetch(a.url || 'https://www.google.com/generate_204', { method: 'GET' });
      const t3 = now();
      const rec2 = { from: b.id, to: a.id, value: t3 - t2, ts: t3 };
      resRecs.push({ pair: `${b.id}->${a.id}`, rec: rec2 });
      try { const hs = await import('@/lib/historyStore'); await hs.appendRecord(`${b.id}->${a.id}`, rec2); } catch {}
    } catch {}

    return NextResponse.json({ ok: true, records: resRecs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
