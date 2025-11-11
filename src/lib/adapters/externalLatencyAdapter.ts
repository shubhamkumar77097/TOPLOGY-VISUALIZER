// src/lib/adapters/externalLatencyAdapter.ts
// Optional adapter to fetch latency-like metrics from an external public API.
// Usage: set EXTERNAL_LATENCY_API_URL to a provider endpoint that returns JSON array of items with {from,to,avg,ts}

export async function fetchExternalLatencySample(apiUrl: string, opts: { pair?: string } = {}) {
  const url = new URL(apiUrl);
  if (opts.pair) url.searchParams.set('pair', opts.pair);
  const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
  if (!res.ok) throw new Error('external api error');
  const j = await res.json();
  // allow service-specific shapes: try to find array at root or in data
  const arr = Array.isArray(j) ? j : (Array.isArray(j.data) ? j.data : []);
  // normalize to { from, to, avg, ts }
  return arr.map((it: any) => ({ from: it.from || it.f || null, to: it.to || it.t || null, avg: it.avg || it.value || it.lat || null, ts: it.ts || it.time || Date.now() }));
}
