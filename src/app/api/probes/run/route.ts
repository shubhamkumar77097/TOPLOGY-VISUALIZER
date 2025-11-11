import { NextResponse } from 'next/server';
import path from 'path';

// server-side pairwise probe runner (demo). Uses internal history append when available.
export async function POST(req: Request) {
  try {
    // If a PROBES_API_KEY is configured, require the client to present it via x-api-key header
    const requiredKey = process.env.PROBES_API_KEY;
    if (requiredKey) {
      const provided = req.headers.get('x-api-key') || '';
      if (provided !== requiredKey) return NextResponse.json({ ok: false, error: 'Invalid API key' }, { status: 401 });
    }
    // Basic per-IP rate limiting (demo): allow one run per 30s per IP
  const xf = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('x-client-ip') || '127.0.0.1';
    const ip = Array.isArray(xf) ? xf[0] : String(xf).split(',')[0].trim();
    const gb: any = (globalThis as any).__probe_buckets = (globalThis as any).__probe_buckets || {};
    const nowTs = Date.now();
    const bucket = gb[ip] || { last: 0 };
    const minInterval = 30 * 1000;
    if (nowTs - (bucket.last || 0) < minInterval) {
      return NextResponse.json({ ok: false, error: 'Rate limit: try again later' }, { status: 429 });
    }
    gb[ip] = { last: nowTs };
    const modPath = path.resolve(process.cwd(), 'src/data/locations.ts');
    // import locations dynamically - this file is TS; import via require-like eval
    let locs: any[] = [];
    try {
      const l = eval('require')(modPath);
      locs = l && l.locations ? l.locations : l.default || l;
    } catch {
      // fallback to data/exchanges.json
      try {
        locs = eval('require')(path.resolve(process.cwd(), 'data', 'exchanges.json'));
      } catch {
        return NextResponse.json({ ok: false, error: 'No locations data available' }, { status: 500 });
      }
    }

    // minimal sample to avoid heavy runs
    const sample = (Array.isArray(locs) ? locs : Object.values(locs)).slice(0, 6);

    // use undici fetch in Node 18+ (global fetch available in Next.js runtime)
    const now = () => Date.now();

    // import server-side appendRecord to avoid HTTP calls
    let appendRecord: any = null;
    try {
      appendRecord = (await import('@/lib/historyStore')).appendRecord;
    } catch {
      appendRecord = null;
    }

  const outRecs: any[] = [];
  // metrics: track last run and counts
  const metrics: any = (globalThis as any).__probe_metrics = (globalThis as any).__probe_metrics || { runs: 0, lastRunTs: 0, totalRecords: 0 };
  metrics.runs = (metrics.runs || 0) + 1;
  metrics.lastRunTs = nowTs;
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const a = sample[i];
        const b = sample[j];
        const urlA = a.url || 'https://www.google.com/generate_204';
        const urlB = b.url || 'https://www.google.com/generate_204';

        // probe A -> B
        const t0 = now();
        try {
          await fetch(urlB, { method: 'GET' });
          const t1 = now();
          const rtt = t1 - t0;
          const rec = { from: a.id || a, to: b.id || b, value: rtt, ts: t1 };
          outRecs.push({ pair: `${a.id}->${b.id}`, rec });
          if (appendRecord) await appendRecord(`${a.id}->${b.id}`, rec);
          metrics.totalRecords = (metrics.totalRecords || 0) + 1;
          // try broadcasting to mock-server HTTP bridge for WS clients
          try { await fetch('http://localhost:8082/broadcast', { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'application/json' } }); } catch {}
        } catch {
          // ignore probe error
        }

        // probe B -> A
        const t2 = now();
        try {
          await fetch(urlA, { method: 'GET' });
          const t3 = now();
          const rtt2 = t3 - t2;
          const rec2 = { from: b.id || b, to: a.id || a, value: rtt2, ts: t3 };
          outRecs.push({ pair: `${b.id}->${a.id}`, rec: rec2 });
          if (appendRecord) await appendRecord(`${b.id}->${a.id}`, rec2);
          metrics.totalRecords = (metrics.totalRecords || 0) + 1;
          try { await fetch('http://localhost:8082/broadcast', { method: 'POST', body: JSON.stringify(rec2), headers: { 'Content-Type': 'application/json' } }); } catch {}
        } catch {
          // ignore
        }

        // small delay
        await new Promise((r) => setTimeout(r, 200));
      }
    }

  return NextResponse.json({ ok: true, records: outRecs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
