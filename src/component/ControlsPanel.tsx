"use client";

import React from 'react';
import RangeSlider from './RangeSlider';
import { useLatencyStore } from '@/lib/store';
import { useEffect } from 'react';
import { exportVisibleCSV, exportVisibleJSON, exportPNG, generateHtmlReport } from '@/lib/export';
import { useTheme } from './ThemeProvider';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function CollapsibleSection({ title, icon, defaultOpen = false, children }: { title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const key = `tv.collapsible.${title}`;
  const readInitial = () => {
    try {
      const v = localStorage.getItem(key);
      if (v === '1') return true;
      if (v === '0') return false;
    } catch {}
    return !!defaultOpen;
  };
  const [open, setOpen] = React.useState<boolean>(() => (typeof window !== 'undefined' ? readInitial() : !!defaultOpen));

  React.useEffect(() => {
    try { localStorage.setItem(key, open ? '1' : '0'); } catch {}
  }, [key, open]);

  return (
    <div style={{ 
      marginBottom: '12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden'
    }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold p-3 hover:bg-white/5 transition-colors"
        style={{ background: 'transparent', textAlign: 'left', color: '#ffffff' }}
      >
        <span className="flex items-center gap-2" style={{ color: '#ffffff' }}>
          {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 140ms ease' }}>
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor" />
          </svg>
          {title}
        </span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function HistorySection() {
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  const setSelectedPair = useLatencyStore((s) => s.setSelectedPair);
  const [range, setRange] = React.useState<'1h'|'24h'|'7d'|'30d'>('24h');
  const [data, setData] = React.useState<{labels:string[], values:number[]}>({ labels: [], values: [] });
  const [pairs, setPairs] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [bucketMs, setBucketMs] = React.useState<number | null>(null);
  const [pairFilter, setPairFilter] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [serverStats, setServerStats] = React.useState<any | null>(null);
  const [seriesRaw, setSeriesRaw] = React.useState<any[] | null>(null);

  useEffect(()=>{
    if (!selectedPair) return setData({ labels: [], values: [] });
    setError(null);
    const defaults: Record<string, number> = { '1h': 60 * 1000, '24h': 10 * 60 * 1000, '7d': 60 * 60 * 1000, '30d': 6 * 60 * 60 * 1000 };
    const bucket = bucketMs || defaults[range] || 60 * 1000;
    const q = new URLSearchParams({ pair: selectedPair, range, bucketMs: String(bucket) });
    setLoading(true);
    fetch(`/api/history/aggregate?${q.toString()}`).then(async (r)=>{
      const j = await r.json().catch(()=>null);
      if (!j || !j.ok || !Array.isArray(j.series)) {
        setData({ labels: [], values: [] });
        setSeriesRaw(null);
        setServerStats(null);
        setLoading(false);
        setError(null);
        return;
      }
      const labels = j.series.map((s:any)=> new Date(s.start).toLocaleString());
      const values = j.series.map((s:any)=> s.avg === null ? null : s.avg);
      setData({ labels, values });
      setSeriesRaw(j.series || []);
      setServerStats(j.stats || null);
      if (!j.stats || typeof j.stats.avg !== 'number') {
        const flat = (j.series || []).flatMap((s:any)=> Array.isArray(s.values) ? s.values : (s.avg !== null ? [s.avg] : []));
        if (flat.length) {
          const min = Math.min(...flat); const max = Math.max(...flat); const avg = flat.reduce((a:number,b:number)=>a+b,0)/flat.length;
          setServerStats({ min: Math.round(min), max: Math.round(max), avg: Math.round(avg), count: flat.length });
        } else if (Array.isArray(j.series) && j.series.length) {
          const vals = j.series.map((s:any)=> typeof s.avg === 'number' ? s.avg : null).filter((v:any)=> v !== null);
          if (vals.length) {
            const min = Math.min(...vals); const max = Math.max(...vals); const avg = vals.reduce((a:number,b:number)=>a+b,0)/vals.length;
            setServerStats({ min: Math.round(min), max: Math.round(max), avg: Math.round(avg), count: vals.length });
          }
        }
      }
      setLoading(false);
    }).catch((e)=>{ setLoading(false); setError(String(e)); });
  }, [selectedPair, range, bucketMs]);

  useEffect(()=>{
    setBucketMs(null);
  }, [range]);

  useEffect(()=>{
    let m=true;
    fetch('/api/history').then(r=>r.json()).then((arr)=>{
      if (!Array.isArray(arr)) return;
      const uniq = Array.from(new Set(arr.map((x:any)=>x.pair))).slice(0,200);
      if (m) setPairs(uniq);
    }).catch(()=>{});
    return ()=>{ m=false };
  },[]);

  const chartData = {
    labels: data.labels,
    datasets: [{ label: selectedPair || 'Latency', data: data.values, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.15)', tension: 0.3 }]
  };

  return (
    <div className="space-y-3">
      {/* Pair Selection */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Filter Pairs</label>
        <input 
          placeholder="Search pairs..." 
          value={pairFilter} 
          onChange={(e)=> setPairFilter(e.target.value)} 
          className="w-full text-xs p-2 rounded bg-black/40 text-white border border-white/10"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Select Pair</label>
        <select 
          value={selectedPair ?? ''} 
          onChange={(e)=> setSelectedPair(e.target.value || null)} 
          className="w-full text-xs p-2 rounded bg-black/40 text-white border border-white/10"
        >
          <option value="">-- Select a pair --</option>
          {pairs.filter(p=> p.toLowerCase().includes(pairFilter.toLowerCase())).map((p)=> <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {selectedPair && (
        <>
          {/* Time Range */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Time Range</label>
            <div className="grid grid-cols-4 gap-1">
              {(['1h','24h','7d','30d'] as const).map((r)=> (
                <button 
                  key={r} 
                  className={`px-2 py-1.5 text-xs rounded transition-colors ${range===r ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`} 
                  onClick={()=>setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          {serverStats && (
            <div className="text-xs p-2 rounded bg-blue-500/10 border border-blue-400/30 text-blue-200">
              Min {serverStats.min ?? '-'}ms · Avg {serverStats.avg ?? '-'}ms · Max {serverStats.max ?? '-'}ms · {serverStats.count ?? 0} samples
            </div>
          )}

          {error && (
            <div className="text-xs p-2 rounded bg-red-500/10 border border-red-400/30 text-red-200">
              {error}
            </div>
          )}

          {/* Bucket Size */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Bucket:</label>
            <select 
              value={String(bucketMs || '')} 
              onChange={(e)=> setBucketMs(e.target.value ? Number(e.target.value) : null)} 
              className="flex-1 text-xs p-1.5 bg-black/40 text-white rounded border border-white/10"
            >
              <option value="">auto</option>
              <option value={60000}>1m</option>
              <option value={600000}>10m</option>
              <option value={3600000}>1h</option>
              <option value={21600000}>6h</option>
            </select>
            <button 
              className="text-xs px-2 py-1.5 bg-green-500/20 text-green-300 border border-green-400/30 rounded hover:bg-green-500/30 transition-colors" 
              onClick={async () => {
                try {
                  const defaults: Record<string, number> = { '1h': 60 * 1000, '24h': 10 * 60 * 1000, '7d': 60 * 60 * 1000, '30d': 6 * 60 * 60 * 1000 };
                  const bucket = bucketMs || defaults[range] || 60 * 1000;
                  const q = new URLSearchParams({ pair: selectedPair || '', range, bucketMs: String(bucket) });
                  const res = await fetch(`/api/history/aggregate?${q.toString()}`);
                  const j = await res.json().catch(()=>null);
                  const rows = [['start','end','count','min','avg','max']];
                  if (j && j.ok && Array.isArray(j.series) && j.series.length) {
                    j.series.forEach((s:any)=> rows.push([new Date(s.start).toISOString(), new Date(s.end).toISOString(), String(s.count || 0), String(s.min ?? ''), String(s.avg ?? ''), String(s.max ?? '')]));
                  }
                  const csv = rows.map((r:any)=> r.map((c:any)=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `${selectedPair || 'history'}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                } catch (e) { console.error('CSV export failed', e); }
              }}
            >
              CSV
            </button>
          </div>

          {/* Chart */}
          <div style={{ height: 200 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Loading...</div>
            ) : data.labels && data.labels.length ? (
              <Line
                data={chartData}
                options={{
                  animation: { duration: 200 },
                  maintainAspectRatio: false,
                  interaction: { intersect: false, mode: 'index' },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: 'rgba(96,165,250,0.5)',
                      borderWidth: 1,
                      callbacks: {
                        label: function(context:any) {
                          const i = context.dataIndex;
                          const s = (seriesRaw && seriesRaw[i]) || null;
                          if (s) return `Avg ${s.avg ?? '-'}ms • Count ${s.count ?? 0} • Min ${s.min ?? '-'} • Max ${s.max ?? '-'}`;
                          return `${context.formattedValue} ms`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.1)' } }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400 text-center p-4">
                No data for this pair and range. Try selecting a different time range or bucket size.
              </div>
            )}
          </div>
        </>
      )}

      {!selectedPair && (
        <div className="text-xs text-gray-400 text-center py-8">
          Select a pair from the dropdown above or click on a latency arc in the visualization to view historical trends.
        </div>
      )}
    </div>
  );
}

export function ControlsPanel() {
  const mobileMode = useLatencyStore((s) => s.mobileMode);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [dashboardVisible, setDashboardVisible] = React.useState(false);
  const providerFilters = useLatencyStore((s) => s.providerFilters);
  const setProviderFilter = useLatencyStore((s) => s.setProviderFilter);
  const exchangeFilters = useLatencyStore((s) => (s as any).exchangeFilters || {});
  const setExchangeFilter = useLatencyStore((s) => (s as any).setExchangeFilter);
  const pulsesEnabled = useLatencyStore((s) => s.pulsesEnabled);
  const setPulsesEnabled = useLatencyStore((s) => s.setPulsesEnabled);
  const arcSpeed = useLatencyStore((s) => s.arcSpeed);
  const setArcSpeed = useLatencyStore((s) => s.setArcSpeed);
  const maxLatency = useLatencyStore((s) => s.maxLatency);
  const setMaxLatency = useLatencyStore((s) => s.setMaxLatency);
  const persistControls = useLatencyStore((s) => s.persistControls);
  const setPersistControls = useLatencyStore((s) => s.setPersistControls);
  const wsStatus = useLatencyStore((s) => s.wsStatus);
  const showHeatmap = useLatencyStore((s) => (s as any).showHeatmap);
  const setShowHeatmap = useLatencyStore((s) => (s as any).setShowHeatmap);
  const showLegend = useLatencyStore((s) => (s as any).showLegend);
  const setShowLegend = useLatencyStore((s) => (s as any).setShowLegend);
  const wasmEnabled = process.env.USE_WASM_SQLITE === '1';
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  const showRegions = useLatencyStore((s) => (s as any).showRegions);
  const setShowRegions = useLatencyStore((s) => (s as any).setShowRegions);
  const showArcs = useLatencyStore((s) => (s as any).showArcs ?? true);
  const setShowArcs = useLatencyStore((s) => (s as any).setShowArcs);
  const showTopology = useLatencyStore((s) => (s as any).showTopology ?? true);
  const setShowTopology = useLatencyStore((s) => (s as any).setShowTopology);
  const setCameraTarget = useLatencyStore((s) => (s as any).setCameraTarget);
  const setRegionFilter = useLatencyStore((s) => (s as any).setRegionFilter);
  const regionFilters = useLatencyStore((s) => (s as any).regionFilters || {});
  const setTheme = useLatencyStore((s) => s.setTheme);
  const lowPerfMode = useLatencyStore((s) => (s as any).lowPerfMode);
  const setLowPerfMode = useLatencyStore((s) => (s as any).setLowPerfMode);
  const smoothingFactor = useLatencyStore((s) => s.smoothingFactor ?? 0.35);
  const setSmoothingFactor = useLatencyStore((s) => (s as any).setSmoothingFactor);
  const serverProbesEnabled = useLatencyStore((s) => (s as any).serverProbesEnabled);
  const setServerProbesEnabled = useLatencyStore((s) => (s as any).setServerProbesEnabled);
  const allowClientProbes = useLatencyStore((s) => (s as any).allowClientProbes);
  const setAllowClientProbes = useLatencyStore((s) => (s as any).setAllowClientProbes);
  const externalSourceEnabled = useLatencyStore((s) => (s as any).externalSourceEnabled);
  const setExternalSourceEnabled = useLatencyStore((s) => (s as any).setExternalSourceEnabled);
  const wsPolling = useLatencyStore((s) => (s as any).wsPolling);
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  const minLatency = useLatencyStore((s) => (s as any).minLatency ?? 0);
  const setMinLatency = useLatencyStore((s) => (s as any).setMinLatency);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (mobileMode) setOpenMobile(true);
  }, [mobileMode]);

  useEffect(() => {
    // This effect should only run once on the client to hydrate controls from localStorage.
    try {
      const raw = localStorage.getItem('tv-controls');
      if (raw) {
        const parsed = JSON.parse(raw);
        const state = useLatencyStore.getState();
        if (parsed.arcSpeed !== undefined) state.setArcSpeed(parsed.arcSpeed);
        if (parsed.pulsesEnabled !== undefined) state.setPulsesEnabled(parsed.pulsesEnabled);
        if (parsed.maxLatency !== undefined) state.setMaxLatency(parsed.maxLatency);
        if (parsed.providerFilters) Object.keys(parsed.providerFilters).forEach((p) => state.setProviderFilter(p, parsed.providerFilters[p]));
        if (parsed.exchangeFilters) Object.keys(parsed.exchangeFilters).forEach((ex) => state.setExchangeFilter(ex, parsed.exchangeFilters[ex]));
        if (parsed.serverProbesEnabled !== undefined) state.setServerProbesEnabled(parsed.serverProbesEnabled);
        if (parsed.allowClientProbes !== undefined) state.setAllowClientProbes(parsed.allowClientProbes);
        if (parsed.externalSourceEnabled !== undefined) state.setExternalSourceEnabled(parsed.externalSourceEnabled);
        if (parsed.showHeatmap !== undefined) (state as any).setShowHeatmap(parsed.showHeatmap);
        if (parsed.showLegend !== undefined) (state as any).setShowLegend(parsed.showLegend);
        if (parsed.showRegions !== undefined) (state as any).setShowRegions(parsed.showRegions);
        if (parsed.showArcs !== undefined) (state as any).setShowArcs(parsed.showArcs);
        if (parsed.showTopology !== undefined) (state as any).setShowTopology(parsed.showTopology);
        if (parsed.lowPerfMode !== undefined) state.setLowPerfMode(parsed.lowPerfMode);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const controlsToPersist = React.useMemo(() => ({
    arcSpeed, pulsesEnabled, maxLatency, providerFilters, exchangeFilters, serverProbesEnabled, allowClientProbes, externalSourceEnabled, showHeatmap, showLegend, showRegions, showArcs, showTopology, lowPerfMode
  }), [arcSpeed, pulsesEnabled, maxLatency, providerFilters, exchangeFilters, serverProbesEnabled, allowClientProbes, externalSourceEnabled, showHeatmap, showLegend, showRegions, showArcs, showTopology, lowPerfMode]);

  useEffect(() => {
    if (!persistControls) return;
    localStorage.setItem('tv-controls', JSON.stringify(controlsToPersist));
  }, [controlsToPersist, persistControls]);

  React.useEffect(() => {
    const onStart = () => setRetrying(true);
    const onDone = () => setRetrying(false);
    window.addEventListener('realtime:reconnect:start', onStart);
    window.addEventListener('realtime:reconnect:done', onDone);
    return () => {
      window.removeEventListener('realtime:reconnect:start', onStart);
      window.removeEventListener('realtime:reconnect:done', onDone);
    };
  }, []);

  // Check if we're in the browser before using portals
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  return (
    <>
      {/* Action Navbar - Top */}
      {isBrowser && createPortal(
        <nav
          className="pointer-events-auto"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '12px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            zIndex: 2147483646,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            overflowX: 'auto'
          }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); }}
        >
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setDashboardVisible((v) => !v)} 
            className="px-2 py-1 rounded text-xs hover:bg-white/10 transition-all" 
            style={{ 
              backgroundColor: dashboardVisible ? 'rgba(59, 130, 246, 0.2)' : 'transparent', 
              border: '1px solid rgba(255,255,255,0.15)', 
              whiteSpace: 'nowrap', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff'
            }}
            title={dashboardVisible ? 'Hide Dashboard' : 'Show Dashboard'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Dashboard</span>
          </button>
          <button onClick={() => setHelpOpen((v) => !v)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic', color: '#ffffff' }}>{helpOpen ? 'Hide Help' : 'Help'}</button>
          <button onClick={async () => {
            if (!confirm('This will backup and clear stored history (history.json and history.sqlite). Continue?')) return;
            try {
              setResetting(true);
              const res = await fetch('/api/history/reset', { method: 'POST' });
              const j = await res.json();
              alert(j.ok ? 'Reset complete' : `Reset failed: ${j.error}`);
            } catch (e) { alert('Reset failed: ' + String(e)); }
            setResetting(false);
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', whiteSpace: 'nowrap' }}>{resetting ? 'Resetting...' : 'Reset History'}</button>
          <button onClick={async () => {
            try {
              const res = await fetch('/api/history/export');
              if (!res.ok) throw new Error('Export failed');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'history.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              alert('Export failed: ' + String(err));
            }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Export CSV</button>
          <button onClick={async () => {
            try {
              await exportVisibleCSV();
            } catch (e) { alert('Export CSV failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Export Visible CSV</button>
          <button onClick={async () => {
            try {
              await exportVisibleJSON();
            } catch (e) { alert('Export JSON failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Export Visible JSON</button>
          <button onClick={async () => {
            try {
              await exportPNG();
            } catch (e) { alert('PNG export failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Save PNG</button>
          <button onClick={async () => {
            try {
              await generateHtmlReport();
            } catch (e) { alert('Report generation failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>HTML Report</button>
          <button onClick={async () => {
            const pair = selectedPair || prompt('Enter pair id (from->to)');
            if (!pair) return;
            try {
              const res = await fetch('/api/probes/trigger', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ pair }) });
              const j = await res.json();
              if (j && j.records) {
                alert('Probe run complete: ' + j.records.map((r:any)=> `${r.pair}:${r.rec.value}ms`).join('\n'));
              } else {
                alert('Probe failed');
              }
            } catch (e) { alert('Probe request failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Run Pair Probe</button>
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent('tv:ws:reconnect')); } catch {} } } className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>{retrying ? 'Retrying…' : 'Retry WS'}</button>
          <button onClick={async () => {
            try {
              const res = await fetch('/api/ws-test', { method: 'POST', body: JSON.stringify({ from: 'test', to: 'test', value: Math.round(Math.random()*200), ts: Date.now() }), headers: { 'Content-Type': 'application/json' } });
              const j = await res.json();
              if (j && j.ok) alert('WS test broadcast sent'); else alert('WS test failed: ' + JSON.stringify(j));
            } catch (e) { alert('WS test failed: ' + String(e)); }
          }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic' }}>Test WS</button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Latency Range Indicator */}
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#3b82f6', fontWeight: 700, fontStyle: 'italic', whiteSpace: 'nowrap' }} title="Current latency range filter">
              📊 {minLatency}-{maxLatency}ms
            </div>
          </div>
        </nav>,
        typeof document !== 'undefined' ? document.body : (globalThis as any)?.document?.body ?? ({} as any)
      )}

      {/* Help Modal */}
      {isBrowser && helpOpen && createPortal(
        <div
          className="pointer-events-auto"
          style={{
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 2147483647,
            pointerEvents: 'auto',
            maxWidth: '500px',
            width: '90%'
          }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); }}
        >
          <div className="text-xs">
            <div className="font-semibold text-base mb-2">Latency Topology Visualizer</div>
            <div className="mt-1">This app shows exchange locations on a 3D globe, live latency between pairs, animated arcs and pulses for recent measurements, and a history store (file or sqlite-wasm).</div>
            <ul className="mt-2 list-disc ml-4 space-y-1">
              <li>Markers: locations rendered with InstancedMesh for performance.</li>
              <li>Latency arcs: animated curves between exchange pairs, pulses indicate recent traffic.</li>
              <li>Heatmap: canvas overlay showing aggregated latency intensity.</li>
              <li>History: stored to <code className="bg-gray-700 px-1 rounded">history.json</code> by default; optional `sql.js` WASM for sqlite via `USE_WASM_SQLITE=1`.</li>
              <li>Export: CSV export available at <code className="bg-gray-700 px-1 rounded">/api/history/export</code>.</li>
            </ul>
            <div className="mt-2">Controls persist to localStorage when 'Persist controls' is enabled.</div>
            {wsPolling && <div className="mt-2 text-yellow-300">Realtime connection unavailable — showing HTTP-poll fallback (mock data). Check the mock WS server or set NEXT_PUBLIC_WS_URL.</div>}
            <button onClick={() => setHelpOpen(false)} className="mt-3 px-3 py-1 rounded text-xs" style={{ backgroundColor: '#3b82f6', color: 'white' }}>Close</button>
          </div>
        </div>,
        typeof document !== 'undefined' ? document.body : (globalThis as any)?.document?.body ?? ({} as any)
      )}

      {/* Main Dashboard Panel */}
      {isBrowser && createPortal(
        <div
          className="z-[1000000] rounded shadow-lg pointer-events-auto w-[360px] max-h-[88vh] overflow-y-auto tv-control-panel"
          onPointerDown={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); }}
          style={{ 
            position: 'fixed',
            top: '50%',
            left: dashboardVisible ? '16px' : '-380px',
            transform: 'translate(0, -50%)',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            zIndex: 2147483647,
            pointerEvents: dashboardVisible ? 'auto' : 'none',
            backdropFilter: 'blur(10px)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            opacity: dashboardVisible ? 1 : 0
          }}
          tabIndex={-1}
        >
          {/* Dashboard Header */}
          <div style={{ 
            padding: '18px 20px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px 12px 0 0'
          }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg tracking-tight" style={{ color: '#fff', marginBottom: '4px' }}>
                  🌐 Network Dashboard
                </h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Latency Topology Monitor</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg text-xs transition-all font-semibold hover:scale-105"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                  color: '#ffffff', 
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            
            {/* Quick Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.15)', 
                padding: '10px 12px', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Status</div>
                <div className="font-bold text-sm" style={{ color: '#22c55e' }}>
                  {wsStatus === 'connected' ? '● Online' : wsStatus === 'connecting' ? '◐ Connecting' : '○ Offline'}
                </div>
              </div>
              
              {/* Latency Color Legend */}
              <div style={{ 
                background: 'rgba(147, 51, 234, 0.15)', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}>
                <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>📊 Latency Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '12px', borderRadius: '3px', background: '#22c55e', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Low (0-50ms)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '12px', borderRadius: '3px', background: '#fbbf24', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Medium (50-150ms)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '12px', borderRadius: '3px', background: '#f97316', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>High (150-300ms)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '12px', borderRadius: '3px', background: '#ef4444', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Very High (300ms+)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div style={{ padding: '18px 20px' }}>
            
            {/* API Endpoints Section */}
            <div style={{ 
              marginBottom: '16px',
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '16px' }}>🌐</span>
                <label htmlFor="tv-api-endpoints" className="text-sm font-semibold" style={{color:'#fff'}}>API Endpoints</label>
              </div>
              <select 
                id="tv-api-endpoints"
                className="w-full p-2.5 rounded-lg text-white text-sm cursor-pointer"
                style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  outline: 'none',
                  color: '#ffffff'
                }}
                onChange={(e) => {
                  const endpoint = e.target.value;
                  if (endpoint) {
                    // Add pretty=1 parameter for formatted JSON
                    const separator = endpoint.includes('?') ? '&' : '?';
                    const urlWithPretty = endpoint + separator + 'pretty=1';
                    window.open(urlWithPretty, '_blank');
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled style={{ color: '#ffffff' }}>Select an endpoint to visit...</option>
                <optgroup label="History">
                  <option value="/api/history">GET /api/history - Get history records</option>
                  <option value="/api/history/export">GET /api/history/export - Export history CSV</option>
                  <option value="/api/history/reset">POST /api/history/reset - Reset history</option>
                  <option value="/api/history/prune">POST /api/history/prune - Prune old records</option>
                  <option value="/api/history/rollup">GET /api/history/rollup - Get rollup stats</option>
                  <option value="/api/history/aggregate">GET /api/history/aggregate - Get aggregated data</option>
                  <option value="/api/history/validate">GET /api/history/validate - Validate history</option>
                </optgroup>
                <optgroup label="Locations">
                  <option value="/api/locations">GET /api/locations - Get all locations</option>
                  <option value="/api/locations/assign">POST /api/locations/assign - Assign location</option>
                  <option value="/api/locations/diagnose">GET /api/locations/diagnose - Diagnose locations</option>
                </optgroup>
                <optgroup label="Probes">
                  <option value="/api/probes/run">POST /api/probes/run - Run probes</option>
                  <option value="/api/probes/trigger">POST /api/probes/trigger - Trigger probe</option>
                  <option value="/api/probes/coordinate">POST /api/probes/coordinate - Coordinate probes</option>
                  <option value="/api/live-probe">GET /api/live-probe - Live probe data</option>
                </optgroup>
                <optgroup label="Data">
                  <option value="/api/regions">GET /api/regions - Get regions</option>
                  <option value="/api/volume">GET /api/volume - Get volume data</option>
                  <option value="/api/external-latency">GET /api/external-latency - External latency</option>
                  <option value="/api/mock-latency">GET /api/mock-latency - Mock latency data</option>
                </optgroup>
                <optgroup label="System">
                  <option value="/api/status">GET /api/status - System status</option>
                  <option value="/api/ws-test">POST /api/ws-test - Test WebSocket</option>
                </optgroup>
              </select>
            </div>

            {/* Collapsible Sections with Icons */}
            <CollapsibleSection title="Cloud Providers" icon="☁️" defaultOpen={false}>
              <div className="space-y-2">
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={providerFilters['AWS'] !== false} onChange={(e)=>setProviderFilter('AWS', e.target.checked)} />
                  <span className="flex-1">AWS</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,152,0,0.2)', color: '#ff9800' }}>Cloud</span>
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={providerFilters['GCP'] !== false} onChange={(e)=>setProviderFilter('GCP', e.target.checked)} />
                  <span className="flex-1">GCP</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(66,133,244,0.2)', color: '#4285f4' }}>Cloud</span>
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={providerFilters['Azure'] !== false} onChange={(e)=>setProviderFilter('Azure', e.target.checked)} />
                  <span className="flex-1">Azure</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,120,215,0.2)', color: '#0078d7' }}>Cloud</span>
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={providerFilters['Other'] !== false} onChange={(e)=>setProviderFilter('Other', e.target.checked)} />
                  <span className="flex-1">Other</span>
                </label>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Exchanges" icon="🏦" defaultOpen={false}>
              <div className="space-y-2">
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={exchangeFilters['Binance'] !== false} onChange={(e)=>setExchangeFilter('Binance', e.target.checked)} />
                  Binance
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={exchangeFilters['Bybit'] !== false} onChange={(e)=>setExchangeFilter('Bybit', e.target.checked)} />
                  Bybit
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={exchangeFilters['Coinbase'] !== false} onChange={(e)=>setExchangeFilter('Coinbase', e.target.checked)} />
                  Coinbase
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={exchangeFilters['Deribit'] !== false} onChange={(e)=>setExchangeFilter('Deribit', e.target.checked)} />
                  Deribit
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={exchangeFilters['OKX'] !== false} onChange={(e)=>setExchangeFilter('OKX', e.target.checked)} />
                  OKX
                </label>
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>More exchanges (live)</div>
                  <ExchangeFilterGroup exchangeFilters={exchangeFilters} setExchangeFilter={setExchangeFilter} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Display Options" icon="🎨" defaultOpen={true}>
              <div className="space-y-2">
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={pulsesEnabled} onChange={(e) => setPulsesEnabled(e.target.checked)} className="mr-2" />
                  Animated Pulses
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} className="mr-2" />
                  Heatmap Overlay
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} className="mr-2" />
                  Show Legend
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={showArcs} onChange={(e) => setShowArcs(e.target.checked)} className="mr-2" />
                  Show Arcs
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={showTopology} onChange={(e) => setShowTopology(e.target.checked)} className="mr-2" />
                  Show Topology
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} className="mr-2" />
                  Show Regions
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={lowPerfMode} onChange={(e) => setLowPerfMode(e.target.checked)} className="mr-2" />
                  Low Performance Mode
                </label>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Performance Settings" icon="⚡" defaultOpen={false}>
              <div className="space-y-3">
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={serverProbesEnabled} onChange={(e) => setServerProbesEnabled(e.target.checked)} className="mr-2" />
                  Server Probes (live)
                </label>
                <label className="flex items-center text-sm hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
                  <input type="checkbox" checked={allowClientProbes} onChange={(e) => setAllowClientProbes(e.target.checked)} className="mr-2" />
                  Allow Client Probes
                </label>
                <div>
                  <label className="text-sm flex justify-between items-center mb-1">
                    <span>Smoothing</span>
                    <span className="font-bold text-blue-400">{Math.round((smoothingFactor||0)*100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={smoothingFactor} onChange={(e) => setSmoothingFactor(Number(e.target.value))} className="w-full" style={{ accentColor: '#3b82f6' }} />
                </div>
                <div>
                  <label className="text-sm flex justify-between items-center mb-1">
                    <span>Arc Speed</span>
                    <span className="font-bold text-purple-400">{arcSpeed.toFixed(1)}x</span>
                  </label>
                  <input type="range" min="0" max="3" step="0.1" value={arcSpeed} onChange={(e) => setArcSpeed(Number(e.target.value))} className="w-full" style={{ accentColor: '#a855f7' }} />
                </div>
                <div>
                  <label className="text-sm mb-1 block">Latency Range: <span className="font-bold text-cyan-400">{minLatency}-{maxLatency}ms</span></label>
                  <RangeSlider value={[minLatency, maxLatency]} onChange={(v:[number,number])=>{ setMinLatency(v[0]); setMaxLatency(v[1]); }} />
                </div>
                <div className="text-xs pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                  WASM SQLite: <span className="font-semibold" style={{ color: wasmEnabled ? '#22c55e' : 'rgba(255,255,255,0.8)' }}>{wasmEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* Historical Trends Section */}
            <CollapsibleSection title="Historical Trends" icon="📊" defaultOpen={false}>
              <HistorySection />
            </CollapsibleSection>

            {/* Camera Presets */}
            <div style={{ 
              marginBottom: '12px',
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '16px' }}>📍</span>
                <div className="text-sm font-semibold">Camera Presets</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  aria-label="Camera preset Asia" 
                  onClick={() => setCameraTarget({ name: 'Asia', pos: [0.5, 0.2, 4] })} 
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.3)', color: '#ffc107' }}
                >
                  Asia
                </button>
                <button 
                  aria-label="Camera preset Europe" 
                  onClick={() => setCameraTarget({ name: 'Europe', pos: [-0.8, 0.2, 4] })} 
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(33,150,243,0.15)', border: '1px solid rgba(33,150,243,0.3)', color: '#2196f3' }}
                >
                  Europe
                </button>
                <button 
                  aria-label="Camera preset Americas" 
                  onClick={() => setCameraTarget({ name: 'Americas', pos: [0.0, 0.1, 6] })} 
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', color: '#4caf50' }}
                >
                  Americas
                </button>
              </div>
            </div>

            {/* Regions Section */}
            <div style={{ 
              marginBottom: '12px',
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '16px' }}>🗺️</span>
                <div className="text-sm font-semibold">Regions</div>
              </div>
              <RegionList setRegionFilter={setRegionFilter} regionFilters={regionFilters} />
            </div>

            {/* Manual Assignment */}
            <CollapsibleSection title="Manual Assignment" icon="⚙️" defaultOpen={false}>
              <ManualAssign />
            </CollapsibleSection>

            {/* Persist Controls */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <label className="flex items-center text-sm hover:bg-white/5 p-2 rounded transition-colors cursor-pointer">
                <input type="checkbox" checked={persistControls} onChange={(e) => setPersistControls(e.target.checked)} className="mr-2" />
                <span className="flex-1">💾 Save settings to localStorage</span>
              </label>
            </div>
          </div>
        </div>,
        typeof document !== 'undefined' ? (document.body) : (globalThis as any)?.document?.body ?? ({} as any)
      )}
    </>
  );
}

function RegionList({ setRegionFilter, regionFilters }: any) {
  const [regions, setRegions] = React.useState<any[]>([]);
  const showEmpty = useLatencyStore((s) => (s as any).showEmptyRegions ?? false);
  const setShowEmpty = useLatencyStore((s) => (s as any).setShowEmptyRegions);
  const visibleRegions = useLatencyStore((s) => (s as any).visibleRegions || new Set());
  const toggleRegionVisibility = useLatencyStore((s) => (s as any).toggleRegionVisibility);
  
  React.useEffect(()=>{ 
    let m=true; 
    fetch('/api/regions').then(r=>r.json()).then((d)=>{ 
      if(m && d && d.features) setRegions(d.features); 
    }).catch(()=>{}); 
    return ()=>{m=false}; 
  },[]);
  
  const filteredRegions = React.useMemo(() => {
    return regions.filter((f:any)=>{
      const rawCode = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || '';
      const code = String(rawCode).trim();
      if (!code || code === '-99') return false;
      const count = f.properties?.serverCount ?? 0;
      return showEmpty || count > 0;
    });
  }, [regions, showEmpty]);

  return (
    <div role="listbox" aria-label="Regions list">
      <div className="mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <label className="flex items-center text-xs cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors">
          <input 
            type="checkbox" 
            checked={showEmpty} 
            onChange={(e) => setShowEmpty(e.target.checked)} 
            className="mr-2" 
          />
          Show empty regions
        </label>
      </div>
      <div className="max-h-48 overflow-y-auto pr-1 space-y-1" style={{ borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', padding: '6px', background: 'rgba(0,0,0,0.1)' }}>
        {filteredRegions.map((f:any)=>{
          const rawCode = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || '';
          const code = String(rawCode).trim();
          const count = f.properties?.serverCount ?? 0;
          const name = f.properties?.name || code;
          return (
            <div key={`${code}-${count}`} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-white/5 transition-colors">
              <label role="option" aria-selected={regionFilters[code] !== false} className="flex items-center flex-1 cursor-pointer" title={`Filter region ${code}`}>
                <input aria-label={`Toggle region ${code}`} type="checkbox" checked={regionFilters[code] !== false} onChange={(e)=>setRegionFilter(code, e.target.checked)} className="mr-2" />
                <span className="flex-1">{name}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>({count})</span>
              </label>
              {toggleRegionVisibility && (
                <button 
                  onClick={() => toggleRegionVisibility(code)} 
                  className="ml-2 px-2 py-0.5 rounded text-xs transition-colors"
                  style={{ 
                    background: visibleRegions.has(code) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    border: `1px solid ${visibleRegions.has(code) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    color: visibleRegions.has(code) ? '#22c55e' : '#ef4444'
                  }}
                >
                  {visibleRegions.has(code) ? '👁️' : '🚫'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManualAssign() {
  const [unassigned, setUnassigned] = React.useState<any[]>([]);
  const [regions, setRegions] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [assignMessage, setAssignMessage] = React.useState<string | null>(null);
  
  React.useEffect(()=>{
    let m=true;
    fetch('/api/locations').then(r=>r.json()).then((d)=>{ if(m) setUnassigned((d||[]).filter((l:any)=>!l.region_code)); }).catch(()=>{});
    fetch('/api/regions').then(r=>r.json()).then((d)=>{ if(m && d && d.features) setRegions(d.features); }).catch(()=>{});
    return ()=>{ m=false };
  },[]);

  async function assign(id: string, code: string) {
    setAssignMessage(`Assigning ${code} to ${id}...`);
    setBusy(true);
    try {
      const res = await fetch('/api/locations/assign', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ id, region: code }) });
      const j = await res.json();
      if (j.ok) {
        try { const list = await fetch('/api/locations').then(r=>r.json()); setUnassigned((list||[]).filter((x:any)=>!x.region_code)); } catch {}
        try { const r = await fetch('/api/regions').then(r=>r.json()); if (r && r.features) setRegions(r.features); } catch {}
        setAssignMessage('✅ Assigned successfully');
      } else {
        setAssignMessage('❌ Failed: ' + (j.error || 'unknown'));
      }
    } catch (e) { setAssignMessage('❌ Error: ' + String(e)); }
    setBusy(false);
    setTimeout(()=>setAssignMessage(null), 3000);
  }

  return (
    <div>
      {unassigned.length === 0 ? (
        <div className="text-xs p-2 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
          ✓ No unassigned locations
        </div>
      ) : (
        <div className="space-y-2">
          {unassigned.map((l:any)=> (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs flex-1 font-mono">{l.id}</div>
              <select 
                aria-label={`Assign region to ${l.id}`} 
                className="text-xs p-1.5 rounded" 
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                defaultValue="" 
                onChange={(e)=>{ const code=e.target.value; if(code) assign(l.id, code); }}
              >
                <option value="">Assign...</option>
                {regions.map((f:any, idx:number)=>{ 
                  const raw = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || ''; 
                  const code = String(raw).trim(); 
                  if (!code || code === '-99') return null; 
                  return <option key={`${code}-${idx}`} value={code}>{code}</option> 
                })}
              </select>
            </div>
          ))}
        </div>
      )}
      {busy && <div className="text-xs mt-2" style={{ color: '#fbbf24' }}>⏳ Processing...</div>}
      {assignMessage && <div className="text-xs mt-2 font-semibold">{assignMessage}</div>}
    </div>
  );
}

function ExchangeFilterGroup({ exchangeFilters, setExchangeFilter }: { exchangeFilters: Record<string, boolean>, setExchangeFilter: (ex: string, v: boolean) => void }) {
  const [exchanges, setExchanges] = React.useState<string[]>([]);
  React.useEffect(() => {
    let m = true;
    fetch('/api/locations').then(r => r.json()).then((data) => {
      if (!m || !Array.isArray(data)) return;
      const uniq = Array.from(new Set(data.map((l: any) => l.name))).sort();
      setExchanges(uniq.slice(0, 50));
    }).catch(() => {});
    return () => { m = false; };
  }, []);
  return (
    <div className="max-h-32 overflow-auto pr-1 space-y-1">
      {exchanges.map((name) => (
        <label key={name} className="flex items-center text-xs hover:bg-white/5 p-1.5 rounded transition-colors cursor-pointer">
          <input type="checkbox" className="mr-2" checked={exchangeFilters[name] !== false} onChange={(e) => setExchangeFilter(name, e.target.checked)} />
          {name}
        </label>
      ))}
    </div>
  );
}
