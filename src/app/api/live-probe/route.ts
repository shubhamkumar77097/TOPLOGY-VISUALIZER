import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory per-IP rate limiter (development/demo only)
const IP_BUCKETS: Record<string, { tokens: number; last: number }> = {};
const MAX_TOKENS = 6;
const REFILL_MS = 10_000;

function allowIp(ip: string) {
  const now = Date.now();
  const bucket = IP_BUCKETS[ip] || { tokens: MAX_TOKENS, last: now };
  const elapsed = now - bucket.last;
  const refill = Math.floor(elapsed / REFILL_MS);
  if (refill > 0) bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refill);
  bucket.last = now;
  if (bucket.tokens <= 0) { IP_BUCKETS[ip] = bucket; return false; }
  bucket.tokens -= 1;
  IP_BUCKETS[ip] = bucket;
  return true;
}

async function probeUrl(url: string, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    await fetch(url, { method: 'GET', signal: controller.signal });
    const rtt = Date.now() - start;
    clearTimeout(id);
    return { ok: true, rtt };
  } catch {
    const rtt = Date.now() - start;
    clearTimeout(id);
    return { ok: false, rtt };
  }
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!allowIp(String(ip))) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) return NextResponse.json({ ok: false, error: 'missing_url' }, { status: 400 });
  try {
    const res = await probeUrl(urlParam, 3000);
    return NextResponse.json({ ok: true, url: urlParam, rtt: res.rtt, success: res.ok });
  } catch {
    return NextResponse.json({ ok: false, error: 'probe_failed' }, { status: 500 });
  }
}
