"use client";

import React, { useEffect } from 'react';
import { useLatencyStore } from '@/lib/store';
import { startLiveLatencyStream, LiveTarget } from '@/lib/adapters/liveLatencyAdapter';
import { DEFAULT_UPDATE_MS } from '@/lib/visualConfig';
import { locations } from '@/data/locations';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const setLatency = useLatencyStore((s) => s.setLatency);
  const setWsStatus = useLatencyStore((s) => s.setWsStatus);

  useEffect(() => {
  let closed = false;
  let sock: WebSocket | null = null;
  let attempts = 0;
  let pollHandle: any = null;
    // smoothing state: keep last known values for lightweight exponential smoothing
    const smoothingFactor = useLatencyStore.getState().smoothingFactor ?? 0.35;
    const lastMap = new Map<string, number>();

    function backoffDelay(attempt:number) {
      // exponential backoff with jitter: base * 1.5^n +/- 20%
      const base = 1000;
      const raw = Math.min(30000, base * Math.pow(1.5, attempt));
      // widen jitter to +/-20%
      const jitter = raw * (0.4 * (Math.random() - 0.5));
      return Math.max(200, Math.round(raw + jitter));
    }

    function startPollFallback() {
      if (pollHandle) return;
      try { (useLatencyStore.getState() as any).setWsPolling(true); } catch {}
      pollHandle = setInterval(async () => {
        try {
          const res = await fetch('/api/mock-latency');
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((d: any) => { const key = `${d.from}->${d.to}`; setLatency(key, d); fetch('/api/history', { method: 'POST', body: JSON.stringify(d), headers: { 'Content-Type': 'application/json' } }).catch(()=>{}); });
          }
        } catch { /* ignore */ }
      }, Number(process.env.NEXT_PUBLIC_EXTERNAL_POLL_MS || DEFAULT_UPDATE_MS));
    }

    function stopPollFallback() {
      if (!pollHandle) return;
      try { clearInterval(pollHandle); } catch {}
      pollHandle = null;
      try { (useLatencyStore.getState() as any).setWsPolling(false); } catch {}
    }

    function connect() {
      attempts += 1;
      setWsStatus('connecting');
      // Derive a reasonable default WS URL: prefer same-host with ws/wss depending on page protocol
      let defaultWs = 'ws://localhost:8081';
      try {
        if (typeof window !== 'undefined' && window.location) {
          const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
          // prefer the mock server on localhost during development
          if (isLocal && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FORCE_LOCAL_WS === '1')) {
            defaultWs = 'ws://localhost:8081';
          } else {
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            defaultWs = `${proto}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
          }
        }
      } catch {}
      // allow overriding WS URL via global override, env, or store
      const wsUrl = (typeof window !== 'undefined' && (window as any).__TV_WS_URL) || process.env.NEXT_PUBLIC_WS_URL || defaultWs;
      console.info('Realtime attempting WS connect to', wsUrl);
      try { sock = new WebSocket(wsUrl); } catch (e) { console.error('Realtime WS open failed', e); setWsStatus('disconnected'); sock = null; }
    if (!sock) return;
      // notify UI reconnect started
      try { window.dispatchEvent(new CustomEvent('realtime:reconnect:start')); } catch {}
      sock.addEventListener('open', () => {
        console.log('Realtime WS connected');
        setWsStatus('connected');
        try { window.dispatchEvent(new CustomEvent('realtime:reconnect:done')); } catch {}
        attempts = 0;
  // stop polling fallback if active
  try { stopPollFallback(); } catch { try { (useLatencyStore.getState() as any).setWsPolling(false); } catch {} }
      });

      // debug: log readyState periodically while connecting to help diagnose opaque errors
      let dbgInterval: any = null;
      try {
        dbgInterval = setInterval(() => {
          try {
            if (!sock) return;
            const rs = sock.readyState;
            // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
            if (rs === 0) console.debug('Realtime WS state: CONNECTING');
            else if (rs === 1) console.debug('Realtime WS state: OPEN');
            else if (rs === 2) console.debug('Realtime WS state: CLOSING');
            else if (rs === 3) console.debug('Realtime WS state: CLOSED');
          } catch { }
        }, 700);
      } catch { }

    if (!sock) return;
      sock.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data as string);
          // coordinate messages instruct clients to probe a target URL and report
          if (data && data.type === 'coordinate' && typeof window !== 'undefined') {
            const allow = (useLatencyStore.getState() as any).allowClientProbes;
            const myId = (window as any).__TV_PROBE_ID || null;
            if (allow && (!data.probeId || data.probeId === myId)) {
              (async () => {
                try {
                  const t0 = Date.now();
                  await fetch(data.targetUrl, { method: 'GET' });
                  const t1 = Date.now();
                  const rec = { from: data.probeId || 'client', to: data.pair?.split('->')[1] || data.targetUrl, value: t1 - t0, ts: t1 };
                  setLatency(`${rec.from}->${rec.to}`, rec);
                  fetch('/api/history', { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
                } catch {
                  // ignore
                }
              })();
            }
            return;
          }

          const key = `${data.from}->${data.to}`;
          // apply lightweight exponential smoothing to value if we have previous
          const prev = lastMap.get(key);
          if (typeof prev === 'number' && typeof data.value === 'number') {
            const sm = prev * (1 - smoothingFactor) + data.value * smoothingFactor;
            data.value = Math.round(sm * 100) / 100;
          }
          if (typeof data.value === 'number') lastMap.set(key, data.value);
          setLatency(key, data);
          // Persist to local API for historical queries
          fetch('/api/history', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
        } catch {
          console.error('Invalid WS message');
        }
      });

    if (!sock) return;
      sock?.addEventListener('close', () => {
        setWsStatus('disconnected');
        if (closed) return;
        try { if (dbgInterval) clearInterval(dbgInterval); } catch {}
        // after repeated failures, fallback to HTTP poll instead of retrying indefinitely
        if (attempts > 6) {
          console.warn('Realtime WS repeatedly failing, switching to HTTP poll fallback');
          try { startPollFallback(); } catch { try { (useLatencyStore.getState() as any).setWsPolling(true); } catch {} }
          return;
        }
        const backoff = backoffDelay(attempts);
        console.log(`Realtime WS closed, reconnecting in ${backoff}ms`);
        setTimeout(() => connect(), backoff);
      });

    if (!sock) return;
      sock?.addEventListener('error', (err) => {
        // Avoid noisy errors; provide a clearer signal for debugging
        console.error('Realtime WS error (see network/WS tab for details)', err instanceof Error ? err.message : err);
        setWsStatus('disconnected');
        try { sock?.close(); } catch { }
        // start HTTP poll fallback if not already started and failures exceed threshold
        if (!pollHandle && !closed && attempts >= 2) {
          try { startPollFallback(); } catch { try { (useLatencyStore.getState() as any).setWsPolling(true); } catch {} }
        }
  try { if (dbgInterval) clearInterval(dbgInterval); } catch {}
      });
    }

    // Listen for explicit reconnect requests from UI
    function onReconnect() {
      try {
        console.info('Reconnect requested');
        try { sock?.close(); } catch {}
        // small delay then reconnect
        setTimeout(() => { try { connect(); } catch {} }, 250);
      } catch {}
    }
    try { window.addEventListener('tv:ws:reconnect', onReconnect as any); } catch {}

    connect();

    // Optional: start browser-based live latency probes when enabled via env
    const useLive = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_LIVE_LATENCY === '1' || process.env.NEXT_PUBLIC_USE_LIVE_LATENCY === 'true');
  const storeServerProbes = (useLatencyStore.getState() as any).serverProbesEnabled;
  const useServerProbes = storeServerProbes || (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_SERVER_PROBES === '1' || process.env.NEXT_PUBLIC_USE_SERVER_PROBES === 'true'));
    let liveHandle: { stop: () => void } | null = null;
    if (useLive && typeof window !== 'undefined') {
      // small set of public CDN endpoints to probe. Map ids to location ids used in your data.
  // Map probes to existing known location ids in data/locations.ts for meaningful visualization
  const find = (provider: string) => locations.find((l) => l.provider === (provider as any));
  const probes: LiveTarget[] = [];
  const a = find('GCP');
  if (a) probes.push({ id: a.id, url: 'https://www.gstatic.com/generate_204', provider: a.provider, regionCode: (a as any).region_code || '' });
  const b = find('AWS');
  if (b) probes.push({ id: b.id, url: 'https://d1.awsstatic.com/favicon.ico', provider: b.provider, regionCode: (b as any).region_code || '' });
  const c = find('Azure');
  if (c) probes.push({ id: c.id, url: 'https://az416426.vo.msecnd.net/favicon.ico', provider: c.provider, regionCode: (c as any).region_code || '' });
      liveHandle = startLiveLatencyStream(probes, (sample) => {
        try {
          // Convert to LatencyRecord expected by setLatency: { from, to, value, ts }
          const key = `${sample.targetId}->${sample.targetId}`;
          const rec = { from: sample.targetId, to: sample.targetId, value: sample.rttMs ?? 0, ts: sample.timestamp } as any;
          setLatency(key, rec);
          // also persist to history API for historical charts
          fetch('/api/history', { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
        } catch {
          // ignore adapter errors
        }
      }, { intervalMs: 6000 });
    }

    // Optional: poll server-side probe runner and apply records into realtime store
    let serverProbeHandle: any = null;
    if (useServerProbes && typeof window !== 'undefined') {
      // poll every 10s by default
      serverProbeHandle = setInterval(async () => {
        try {
          const res = await fetch('/api/probes/run', { method: 'POST' });
          if (!res.ok) return;
          const j = await res.json();
          if (j && Array.isArray(j.records)) {
            j.records.forEach((it: any) => {
              const key = it.pair || `${it.rec.from}->${it.rec.to}`;
              const rec = it.rec || it;
              // smoothing not applied for server probe samples
              setLatency(key, rec);
              // ensure persisted too
              fetch('/api/history', { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
            });
          }
        } catch {
          // ignore
        }
      }, 10000);
    }

  // Optional: poll external latency proxy when enabled in controls
  let externalHandle: any = null;
  const externalPollMs = Number(process.env.NEXT_PUBLIC_EXTERNAL_POLL_MS || DEFAULT_UPDATE_MS);
    // Start interval that checks the store flag and fetches when enabled
    externalHandle = setInterval(async () => {
      try {
        const enabled = (useLatencyStore.getState() as any).externalSourceEnabled;
        if (!enabled) return;
        const res = await fetch('/api/external-latency');
        if (!res.ok) return;
        const j = await res.json();
        // support shapes: { data: [...] } or { source, data } or array
        const arr = Array.isArray(j) ? j : (Array.isArray(j.data) ? j.data : []);
        arr.forEach((it: any) => {
          const rec = {
            from: it.from || it.f || it.src || null,
            to: it.to || it.t || it.dst || null,
            value: it.avg || it.value || it.lat || it.rtt || 0,
            ts: it.ts || it.time || Date.now(),
          } as any;
          if (rec.from && rec.to) {
            const key = `${rec.from}->${rec.to}`;
            setLatency(key, rec);
            fetch('/api/history', { method: 'POST', body: JSON.stringify(rec), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
          }
        });
      } catch {
        // ignore errors from external polling
      }
    }, externalPollMs);

    return () => {
      closed = true;
      try { sock?.close(); } catch { }
      try { window.removeEventListener('tv:ws:reconnect', onReconnect as any); } catch {}
      // ensure all periodic handles are cleared and polling stopped
      try { stopPollFallback(); } catch { if (pollHandle) { try { clearInterval(pollHandle); } catch {} pollHandle = null; } }
      if (serverProbeHandle) { clearInterval(serverProbeHandle); serverProbeHandle = null; }
      if (externalHandle) { clearInterval(externalHandle); externalHandle = null; }
      if (liveHandle) { try { liveHandle.stop(); } catch {} }
    };
  }, [setLatency, setWsStatus]);

  return <>{children}</>;
}
