import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    const metrics: any = (globalThis as any).__probe_metrics || { runs: 0, lastRunTs: null, totalRecords: 0 };
    const buckets: any = (globalThis as any).__probe_buckets || {};
    const mem = process.memoryUsage();
    const load = typeof os !== 'undefined' && typeof os.loadavg === 'function' ? os.loadavg() : null;
    const uptime = typeof process.uptime === 'function' ? process.uptime() : 0;
    return NextResponse.json({ ok: true, metrics, buckets, memory: mem, uptime, load });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
