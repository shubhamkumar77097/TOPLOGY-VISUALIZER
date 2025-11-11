"use client";

import React from 'react';
import { useLatencyStore } from '@/lib/store';

export default function SystemStatus() {
  const wsStatus = useLatencyStore((s) => s.wsStatus);
  const [validating, setValidating] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const latencies = useLatencyStore((s) => s.latencies);
  const [serverStatus, setServerStatus] = React.useState<any>(null);

  const runValidate = async () => {
    setValidating(true);
    try {
      const res = await fetch('/api/history/validate');
      const j = await res.json();
      setStatus(JSON.stringify(j));
    } catch (e) {
      setStatus(String(e));
    }
    setValidating(false);
  };

  React.useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
          const res = await fetch('/api/status');
          const j = await res.json();
          if (mounted) setServerStatus(j);
        } catch {
          if (mounted) setServerStatus(null);
        }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const runPrune = async () => {
    if (!confirm('Run prune now? This will trim stored history per-pair.')) return;
    try {
      await fetch('/api/history/prune', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keepPerPair: 500 }) });
      alert('Prune requested');
  } catch { alert('Prune failed'); }
  };

  return (
    <div className="fixed left-4 bottom-4 z-50 bg-black/70 text-white p-3 rounded text-sm max-w-xs">
      <div className="flex items-center justify-between">
        <div>WS: <span className="font-semibold">{wsStatus}</span></div>
        <div>Active pairs: <span className="font-semibold">{Object.keys(latencies).length}</span></div>
        <button onClick={runValidate} className="px-2 py-1 rounded bg-white/10">{validating ? 'Validating...' : 'Validate History'}</button>
      </div>
      <div className="mt-2">
        <div>Server: {serverStatus ? `pid ${serverStatus.pid}, cpu ${serverStatus.cpus}, pairs ${serverStatus.pairCount}` : 'connecting...'}</div>
        <div className="mt-1">
          <button onClick={runPrune} className="px-2 py-1 rounded bg-red-600 text-white text-sm">Run Prune Now</button>
        </div>
      </div>
      {status && <pre className="mt-2 text-xs whitespace-pre-wrap">{status}</pre>}
    </div>
  );
}
