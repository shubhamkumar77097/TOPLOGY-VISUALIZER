import { NextResponse } from 'next/server';

// Simple server-side probe that performs an HTTP GET to the target URL and returns server-side RTT in ms.
// This helps avoid browser CORS/no-cors timing issues and can be used as a more reliable 'live' probe.
export async function GET(req: Request) {
  try {
    // simple auth: require x-tv-auth header matching env PROBE_SECRET (if set)
    const secret = process.env.PROBE_SECRET || process.env.NEXT_PUBLIC_PROBE_SECRET;
    if (secret) {
      const hdr = (req.headers && (req.headers as any).get && (req.headers as any).get('x-tv-auth')) || '';
      if (!hdr || String(hdr) !== String(secret)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    // basic in-memory rate limiting per IP
    const RATE: any = (globalThis as any).__probe_rate = (globalThis as any).__probe_rate || { byIp: new Map(), limit: 30, period: 60 * 1000 };
    try {
      const ip = (req.headers && (req.headers as any).get && (req.headers as any).get('x-forwarded-for')) || 'local';
      const now = Date.now();
      const entry = RATE.byIp.get(ip) || { ts: now, count: 0 };
      if (now - entry.ts > RATE.period) { entry.ts = now; entry.count = 0; }
      entry.count += 1;
      RATE.byIp.set(ip, entry);
      if (entry.count > RATE.limit) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    } catch {}
    const url = new URL(req.url);
    const target = url.searchParams.get('target');
    if (!target) return NextResponse.json({ ok: false, error: 'missing target' }, { status: 400 });
    // Only allow http(s)
    if (!/^https?:\/\//.test(target)) return NextResponse.json({ ok: false, error: 'invalid target' }, { status: 400 });
    // Basic allowlist to mitigate SSRF: only allow well-known CDN/measurement hosts used by probes
    try {
      const parsed = new URL(target);
      const host = parsed.hostname || '';
      const allowedSuffixes = ['gstatic.com', 'awsstatic.com', 'msecnd.net', 'cloudfront.net', 'cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'jsdelivr.net'];
      const ok = allowedSuffixes.some((s) => host === s || host.endsWith('.' + s));
      if (!ok) return NextResponse.json({ ok: false, error: 'target not allowed' }, { status: 403 });
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid target' }, { status: 400 });
    }

    const start = Date.now();
    const res = await fetch(target, { method: 'GET', cache: 'no-store' });
    const end = Date.now();
    const rtt = Math.max(0, end - start);
    return NextResponse.json({ ok: true, rtt, status: res.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
