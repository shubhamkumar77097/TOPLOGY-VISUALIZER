import { NextResponse } from 'next/server';
import { locations } from '@/data/locations';

function randLatency(base = 60) { return Math.max(5, Math.round(base + (Math.random() - 0.5) * base)); }

export async function GET() {
  // produce a few random pair latencies
  const out: any[] = [];
  const sample = locations.slice(0, Math.min(10, locations.length));
  for (let i = 0; i < Math.min(6, sample.length); i++) {
    const a = sample[Math.floor(Math.random() * sample.length)];
    const b = sample[Math.floor(Math.random() * sample.length)];
    if (a.id === b.id) continue;
    out.push({ from: a.id, to: b.id, value: randLatency(40 + Math.random() * 200), ts: Date.now() });
  }
  return NextResponse.json(out);
}
