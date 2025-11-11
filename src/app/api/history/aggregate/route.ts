import { NextResponse } from 'next/server';
import * as historyStore from '@/lib/historyStore';

// Aggregation endpoint for historical latency data.
// Query params: pair (optional), range (1h|24h|7d|30d) or fromTs/toTs (ms), optional bucketMs
export async function GET(req: Request) {
  try {
    // simple in-memory cache (per-process) with short TTL
    const CACHE: any = (globalThis as any).__agg_cache = (globalThis as any).__agg_cache || { data: new Map(), ttl: 20 * 1000 };
    const cacheKey = req.url;
    const nowMs = Date.now();
    const cached = CACHE.data.get(cacheKey);
    if (cached && (nowMs - cached.ts) < CACHE.ttl) {
      return new Response(JSON.stringify(cached.value), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const url = new URL(req.url);
    const q = url.searchParams;
    const pair = q.get('pair') || undefined;
    const range = q.get('range') || '24h';
    const bucketMsParam = q.get('bucketMs');

    const now = Date.now();
    let fromTs: number | undefined;
    let toTs: number | undefined = now;
    if (q.get('fromTs')) fromTs = Number(q.get('fromTs')) || undefined;
    if (q.get('toTs')) toTs = Number(q.get('toTs')) || undefined;

    if (!fromTs) {
      switch (range) {
        case '1h': fromTs = now - 1 * 60 * 60 * 1000; break;
        case '24h': fromTs = now - 24 * 60 * 60 * 1000; break;
        case '7d': fromTs = now - 7 * 24 * 60 * 60 * 1000; break;
        case '30d': fromTs = now - 30 * 24 * 60 * 60 * 1000; break;
        default: fromTs = now - 24 * 60 * 60 * 1000;
      }
    }

  // choose sensible default bucket size
    let bucketMs: number;
    if (bucketMsParam) bucketMs = Number(bucketMsParam) || 60 * 1000;
    else {
      const span = (toTs || now) - (fromTs || now - 24 * 60 * 60 * 1000);
      if (span <= 60 * 60 * 1000) bucketMs = 60 * 1000; // 1m
      else if (span <= 24 * 60 * 60 * 1000) bucketMs = 10 * 60 * 1000; // 10m
      else if (span <= 7 * 24 * 60 * 60 * 1000) bucketMs = 60 * 60 * 1000; // 1h
      else bucketMs = 6 * 60 * 60 * 1000; // 6h
    }

  // compute bucket-aligned start/end for aggregation
  const start = Math.floor((fromTs as number) / bucketMs) * bucketMs;
  const end = Math.ceil((toTs as number) / bucketMs) * bucketMs;

  // If sqlite rollups table exists, prefer using it for hourly/daily buckets
    try {
      const mod: any = await import('sql.js');
      const initSqlJs = mod?.default || mod;
      const SQL = await initSqlJs({});
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.resolve(process.cwd(), 'history.sqlite');
      if (fs.existsSync(dbPath)) {
        const buf = fs.readFileSync(dbPath);
        const db = new SQL.Database(new Uint8Array(buf));
        // check for rollups table
        try {
          const r = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='rollups'");
          if (r && r[0] && r[0].values && r[0].values.length) {
            // query rollups in requested bucket size if bucket aligns to hour/day
            const period = bucketMs >= 24*60*60*1000 ? 'day' : bucketMs >= 60*60*1000 ? 'hour' : null;
            if (period) {
              // compute bucket starts between fromTs and toTs by bucketMs
              const outSeries: any[] = [];
              // prepare statement to lookup rollups with parameters: pair, period, bucket
              const stmt = db.prepare('SELECT min, max, avg, count FROM rollups WHERE pair = ? AND period = ? AND bucket = ?');
              for (let t = start; t < end; t += bucketMs) {
                try {
                  const rows = stmt.getAsObject([pair || '', period, t]);
                  if (rows && Object.keys(rows).length) {
                    const min = rows.min ?? null; const max = rows.max ?? null; const avg = rows.avg ?? null; const count = rows.count ?? 0;
                    outSeries.push({ start: t, end: t + bucketMs, count, min, max, avg });
                    continue;
                  }
                } catch {
                  // no matching row
                }
                outSeries.push({ start: t, end: t + bucketMs, count: 0, min: null, max: null, avg: null });
              }
              try { if (stmt && typeof (stmt as any).free === 'function') (stmt as any).free(); } catch {}
              const stats = { min: null, max: null, avg: null, count: 0 };
              const resp = { ok: true, pair: pair||null, fromTs, toTs, bucketMs, stats, series: outSeries };
              CACHE.data.set(cacheKey, { ts: nowMs, value: resp });
              return new Response(JSON.stringify(resp), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
          }
        } catch {}
      }
    } catch {
      // ignore sql.js errors and fall back to historyStore
    }

  if (!historyStore || !historyStore.queryRecords) return NextResponse.json({ ok: false, error: 'history store not available' }, { status: 500 });

  const records = await historyStore.queryRecords(pair, fromTs, toTs);

  // ensure records is array of { from,to,value,ts } (if pair omitted, queryRecords returns flattened with pair)
  const recs = Array.isArray(records) ? records : [];

  // build buckets
  const buckets: any[] = [];
  for (let t = start; t < end; t += bucketMs) buckets.push({ start: t, end: t + bucketMs, values: [] as number[] });

    for (const r of recs) {
      const ts = Number(r.ts) || 0;
      if (ts < (fromTs as number) || ts > (toTs as number)) continue;
      const idx = Math.floor((ts - start) / bucketMs);
      if (idx >= 0 && idx < buckets.length) buckets[idx].values.push(Number(r.value));
    }

    const agg = buckets.map((b) => {
      const vals = b.values;
      if (!vals || vals.length === 0) return { start: b.start, end: b.end, count: 0, min: null, max: null, avg: null };
      const sum = vals.reduce((s: number, v: number) => s + v, 0);
      return { start: b.start, end: b.end, count: vals.length, min: Math.min(...vals), max: Math.max(...vals), avg: Math.round((sum / vals.length) * 100) / 100 };
    });

    // overall stats
    const allVals = recs.map((r: any) => Number(r.value)).filter((v: number) => !Number.isNaN(v));
    const stats = allVals.length ? { min: Math.min(...allVals), max: Math.max(...allVals), avg: Math.round((allVals.reduce((s: number, v: number) => s + v, 0) / allVals.length) * 100) / 100, count: allVals.length } : { min: null, max: null, avg: null, count: 0 };

  const resp = { ok: true, pair: pair || null, fromTs, toTs, bucketMs, stats, series: agg };
  CACHE.data.set(cacheKey, { ts: nowMs, value: resp });
  return NextResponse.json(resp);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
