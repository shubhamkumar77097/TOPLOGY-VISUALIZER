import { NextResponse } from 'next/server';

const CACHE_TTL = Number(process.env.EXTERNAL_LATENCY_CACHE_TTL_MS || 30_000); // 30s default

type CacheEntry = { ts: number; body: any };
const cache = new Map<string, CacheEntry>();

// very small in-memory rate limit per ip
const RATE_LIMIT_MS = Number(process.env.EXTERNAL_LATENCY_RATE_LIMIT_MS || 1000);
const lastCall = new Map<string, number>();

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
  const now = Date.now();
  const prev = lastCall.get(ip) || 0;
  if (now - prev < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  lastCall.set(ip, now);

  const apiUrl = process.env.EXTERNAL_LATENCY_API_URL;
  if (!apiUrl) return NextResponse.json({ error: 'no_external_api_configured' }, { status: 400 });

  const cacheKey = apiUrl + '::' + new URL(req.url).searchParams.toString();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json({ source: 'cache', data: cached.body });
  }

  try {
    const url = new URL(apiUrl);
    // forward query params
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const r = await fetch(url.toString(), { method: 'GET' });
    if (!r.ok) return NextResponse.json({ error: 'upstream_error', status: r.status }, { status: 502 });
    const body = await r.json();
    cache.set(cacheKey, { ts: now, body });
    return NextResponse.json({ source: 'upstream', data: body });
  } catch (err: any) {
    return NextResponse.json({ error: 'fetch_failed', message: String(err) }, { status: 502 });
  }
}
