// Lightweight browser-side live latency adapter (probes public endpoints)
export type LiveTarget = {
  id: string;
  url: string;
  provider?: string;
  regionCode?: string;
};

export type LiveSample = {
  targetId: string;
  rttMs: number | null;
  timestamp: number;
  provider?: string;
  regionCode?: string;
};

export function startLiveLatencyStream(
  targets: LiveTarget[],
  onSample: (s: LiveSample) => void,
  opts?: { intervalMs?: number }
) {
  const intervalMs = opts?.intervalMs ?? 5000;
  const useServerProbe = (typeof window !== 'undefined' && (window as any).__TV_USE_SERVER_PROBE) || (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_SERVER_PROBE === '1' || process.env.NEXT_PUBLIC_USE_SERVER_PROBE === 'true'));
  let stopped = false;

  async function probe(t: LiveTarget) {
    if (useServerProbe && typeof window !== 'undefined') {
      try {
        const probeUrl = `/api/live/probe?target=${encodeURIComponent(t.url)}`;
        const start = Date.now();
        const res = await fetch(probeUrl, { method: 'GET', cache: 'no-store' });
        const json = await res.json().catch(() => null);
        const end = Date.now();
        const rtt = json && json.ok && typeof json.rtt === 'number' ? json.rtt : Math.max(0, end - start);
        if (!stopped) onSample({ targetId: t.id, rttMs: rtt, timestamp: Date.now(), provider: t.provider, regionCode: t.regionCode });
      } catch {
        // fallback to browser timing
      }
    }

    // Browser fallback: measure with fetch and performance timing when server probe not used or failed
    let start = 0;
    try {
      start = performance.now();
      await fetch(`${t.url}?_=${Date.now()}`, { method: 'GET', cache: 'no-store', mode: 'no-cors' });
      const end = performance.now();
      if (!stopped) onSample({ targetId: t.id, rttMs: Math.max(0, Math.round(end - start)), timestamp: Date.now(), provider: t.provider, regionCode: t.regionCode });
    } catch {
      const end = performance.now();
      if (!stopped) onSample({ targetId: t.id, rttMs: Math.max(0, Math.round(end - start)), timestamp: Date.now(), provider: t.provider, regionCode: t.regionCode });
    }
  }

  // initial immediate pass
  targets.forEach((t) => probe(t));
  const id = window.setInterval(() => { if (!stopped) targets.forEach((t) => probe(t)); }, intervalMs);

  return { stop() { stopped = true; clearInterval(id); } };
}
// (single implementation kept above)
