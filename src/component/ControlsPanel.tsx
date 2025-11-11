"use client";

import React from 'react';
import RangeSlider from './RangeSlider';
import { useLatencyStore } from '@/lib/store';
import { useEffect } from 'react';
import { exportVisibleCSV, exportVisibleJSON, exportPNG, generateHtmlReport } from '@/lib/export';
import { useTheme } from './ThemeProvider';

export function ControlsPanel() {
  const mobileMode = useLatencyStore((s) => s.mobileMode);
  const [openMobile, setOpenMobile] = React.useState(false);
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
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [focusedSuggestion, setFocusedSuggestion] = React.useState<number>(-1);
  const showRegions = useLatencyStore((s) => (s as any).showRegions);
  const setShowRegions = useLatencyStore((s) => (s as any).setShowRegions);
  const showArcs = useLatencyStore((s) => (s as any).showArcs ?? true);
  const setShowArcs = useLatencyStore((s) => (s as any).setShowArcs);
  const showTopology = useLatencyStore((s) => (s as any).showTopology ?? true);
  const setShowTopology = useLatencyStore((s) => (s as any).setShowTopology);
  const setCameraTarget = useLatencyStore((s) => (s as any).setCameraTarget);
  const searchQuery = useLatencyStore((s) => s.searchQuery);
  const setSearchQuery = useLatencyStore((s) => s.setSearchQuery);
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

  // Ensure panel is open by default on mobile so controls aren't hidden
  useEffect(() => {
    if (mobileMode) setOpenMobile(true);
  }, [mobileMode]);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tv-controls');
      if (raw) {
        const parsed = JSON.parse(raw);
  if (parsed.arcSpeed !== undefined) setArcSpeed(parsed.arcSpeed);
  if (parsed.pulsesEnabled !== undefined) setPulsesEnabled(parsed.pulsesEnabled);
  if (parsed.maxLatency !== undefined) setMaxLatency(parsed.maxLatency);
  if (parsed.providerFilters) Object.keys(parsed.providerFilters).forEach((p) => setProviderFilter(p, parsed.providerFilters[p]));
  if (parsed.exchangeFilters) Object.keys(parsed.exchangeFilters).forEach((ex) => setExchangeFilter(ex, parsed.exchangeFilters[ex]));
  if (parsed.serverProbesEnabled !== undefined) setServerProbesEnabled(parsed.serverProbesEnabled);
  if (parsed.allowClientProbes !== undefined) setAllowClientProbes(parsed.allowClientProbes);
  if (parsed.externalSourceEnabled !== undefined) setExternalSourceEnabled(parsed.externalSourceEnabled);
  if (parsed.showHeatmap !== undefined) setShowHeatmap(parsed.showHeatmap);
  if (parsed.showLegend !== undefined) setShowLegend(parsed.showLegend);
  if (parsed.showRegions !== undefined) setShowRegions(parsed.showRegions);
  if (parsed.showArcs !== undefined) setShowArcs(parsed.showArcs);
  if (parsed.showTopology !== undefined) setShowTopology(parsed.showTopology);
  if (parsed.lowPerfMode !== undefined) setLowPerfMode(parsed.lowPerfMode);
      }
    } catch { 
      // ignore
    }
  }, [setArcSpeed, setPulsesEnabled, setMaxLatency, setProviderFilter, setServerProbesEnabled, setAllowClientProbes, setExternalSourceEnabled, setLowPerfMode, setShowHeatmap, setShowLegend, setShowRegions]);

  // Persist when controls change
  useEffect(() => {
    if (!persistControls) return;
  const payload = { arcSpeed, pulsesEnabled, maxLatency, providerFilters, exchangeFilters, serverProbesEnabled, allowClientProbes, externalSourceEnabled, showHeatmap, showLegend, showRegions, showArcs, showTopology, lowPerfMode };
    localStorage.setItem('tv-controls', JSON.stringify(payload));
  }, [arcSpeed, pulsesEnabled, maxLatency, providerFilters, persistControls, serverProbesEnabled, allowClientProbes, externalSourceEnabled, lowPerfMode, showHeatmap, showLegend, showRegions]);

  // load persisted theme
  useEffect(() => {
    try {
      const t = localStorage.getItem('tv-theme');
      if (t) {
        setTheme(t as any);
        if (t === 'light') document.documentElement.classList.add('light');
        else document.documentElement.classList.remove('light');
      }
    } catch {}
  }, [setTheme]);

  // suggestions: fetch locations and filter client-side with debounce and keyboard support
  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;
    if (!searchQuery || searchQuery.trim().length < 2) { setSuggestions([]); setFocusedSuggestion(-1); return () => { mounted = false; if (timer) clearTimeout(timer); } }
    
    timer = setTimeout(() => {
      fetch('/api/locations').then((r) => r.json()).then((data) => {
        if (!mounted) return;
        const q = (searchQuery || '').toLowerCase();
        const hits = (data || []).filter((l: any) => [l.id, l.name, l.city, l.provider].join(' ').toLowerCase().includes(q)).slice(0, 6);
        setSuggestions(hits);
        setFocusedSuggestion(-1);
      }).catch(() => { if (mounted) { setSuggestions([]); setFocusedSuggestion(-1); } });
    }, 250);
    return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [searchQuery]);

  // Listen for realtime reconnect lifecycle events to drive the Retry UI spinner
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

  return (
    <div
      className={`fixed top-4 right-4 z-[100000] p-3 rounded shadow-lg pointer-events-auto ${mobileMode ? 'w-[92vw] max-w-sm' : 'w-80'} max-h-[80vh] overflow-y-auto`}
      style={{ backgroundColor: 'var(--panel-bg)', color: 'var(--panel-fg)', border: '1px solid var(--panel-border)' }}
    >
      {mobileMode && (
        <div className="mb-2">
          <button onClick={() => setOpenMobile((v) => !v)} className="px-3 py-1 rounded text-sm" style={{ backgroundColor: 'var(--button-bg)' }}>{openMobile ? 'Close' : 'Open'} Controls</button>
        </div>
      )}
  {!mobileMode || openMobile ? (
  <>
  {/* Theme Toggle Button */}
  <div className="mb-3 flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--panel-border)' }}>
    <h4 className="font-semibold text-sm">Controls</h4>
    <button 
      onClick={toggleTheme}
      className="px-3 py-1 rounded text-sm transition-all"
      style={{ backgroundColor: 'var(--button-bg)', color: 'var(--panel-fg)', border: '1px solid var(--panel-border)' }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  </div>
  <h4 className="font-semibold mb-2">Filters</h4>
  {Object.keys(providerFilters).map((p) => (
        <label key={p} className="flex items-center text-sm" title={`Toggle ${p} provider`}>
          <input
            type="checkbox"
            aria-checked={providerFilters[p]}
            aria-label={`Filter ${p}`}
            checked={providerFilters[p]}
            onChange={(e) => setProviderFilter(p, e.target.checked)}
            className="mr-2"
          />
          {p}
        </label>
      ))}
      {/* Exchange filters (built from live locations) */}
      <div className="mt-2">
        <div className="text-xs font-semibold mb-1">Exchanges</div>
        <ExchangeFilterGroup exchangeFilters={exchangeFilters} setExchangeFilter={setExchangeFilter} />
      </div>
      <div className="mt-2">
        <label className="flex items-center text-sm">
          <input type="checkbox" checked={pulsesEnabled} onChange={(e) => setPulsesEnabled(e.target.checked)} className="mr-2" />
          Pulses
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} className="mr-2" />
          Heatmap
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} className="mr-2" />
          Legend
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={showArcs} onChange={(e) => setShowArcs(e.target.checked)} className="mr-2" />
          Show Arcs
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={showTopology} onChange={(e) => setShowTopology(e.target.checked)} className="mr-2" />
          Show Topology
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={serverProbesEnabled} onChange={(e) => setServerProbesEnabled(e.target.checked)} className="mr-2" />
          Server Probes (live)
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={allowClientProbes} onChange={(e) => setAllowClientProbes(e.target.checked)} className="mr-2" />
          Allow Client Probes (consent)
        </label>
        <div className="mt-1 text-xs text-gray-300">WASM SQLite: <span className="font-semibold">{wasmEnabled ? 'enabled' : 'disabled'}</span></div>
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <div className="text-xs px-2 py-1 rounded" title={`WebSocket: ${wsStatus}`} style={{ background: wsStatus === 'connected' ? '#16a34a' : wsStatus === 'connecting' ? '#f59e0b' : '#ef4444', color: 'white' }}>{wsStatus}</div>
          {/* Clearer WS fallback indicator placed prominently */}
          {wsPolling && (
            <div className="text-xs px-2 py-1 rounded bg-yellow-700 text-white" title="Realtime connection unavailable — using HTTP-poll fallback">
              Realtime unavailable — using HTTP poll fallback
            </div>
          )}
          <button onClick={() => setHelpOpen((v) => !v)} className="px-2 py-1 rounded bg-white/10 text-sm">{helpOpen ? 'Hide' : 'Help / About'}</button>
          <button onClick={async () => {
            if (!confirm('This will backup and clear stored history (history.json and history.sqlite). Continue?')) return;
            try {
              setResetting(true);
              const res = await fetch('/api/history/reset', { method: 'POST' });
              const j = await res.json();
              alert(j.ok ? 'Reset complete' : `Reset failed: ${j.error}`);
            } catch (e) { alert('Reset failed: ' + String(e)); }
            setResetting(false);
          }} className="px-2 py-1 rounded bg-red-600 text-sm">{resetting ? 'Resetting...' : 'Reset History'}</button>
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
          }} className="px-2 py-1 rounded bg-blue-600 text-sm ml-2">Export CSV</button>
          <button onClick={async () => {
            try {
              await exportVisibleCSV();
            } catch (e) { alert('Export CSV failed: ' + String(e)); }
          }} className="px-2 py-1 rounded bg-blue-600 text-sm ml-2">Export Visible CSV</button>
          <button onClick={async () => {
            try {
              await exportVisibleJSON();
            } catch (e) { alert('Export JSON failed: ' + String(e)); }
          }} className="px-2 py-1 rounded bg-sky-600 text-sm ml-2">Export Visible JSON</button>
          <button onClick={async () => {
            try {
              await exportPNG();
            } catch (e) { alert('PNG export failed: ' + String(e)); }
          }} className="px-2 py-1 rounded bg-neutral-700 text-sm ml-2">Save Snapshot PNG</button>
          <button onClick={async () => {
            try {
              await generateHtmlReport();
            } catch (e) { alert('Report generation failed: ' + String(e)); }
          }} className="px-2 py-1 rounded bg-emerald-700 text-sm ml-2">Generate HTML Report</button>
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
          }} className="px-2 py-1 rounded bg-emerald-600 text-sm ml-2">Run Pair Probe</button>
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent('tv:ws:reconnect')); } catch {} } } className="px-2 py-1 rounded bg-orange-500 text-sm ml-2">{retrying ? 'Retrying…' : 'Retry WS'}</button>
          <button onClick={async () => {
            try {
              const res = await fetch('/api/ws-test', { method: 'POST', body: JSON.stringify({ from: 'test', to: 'test', value: Math.round(Math.random()*200), ts: Date.now() }), headers: { 'Content-Type': 'application/json' } });
              const j = await res.json();
              if (j && j.ok) alert('WS test broadcast sent'); else alert('WS test failed: ' + JSON.stringify(j));
            } catch (e) { alert('WS test failed: ' + String(e)); }
          }} className="px-2 py-1 rounded bg-indigo-600 text-sm ml-2">Test WS Broadcast</button>
        </div>
        {helpOpen && (
          <div className="mt-2 p-2 text-xs bg-black/60 rounded max-w-xs">
            <div className="font-semibold">Latency Topology Visualizer</div>
            <div className="mt-1">This app shows exchange locations on a 3D globe, live latency between pairs, animated arcs and pulses for recent measurements, and a history store (file or sqlite-wasm).</div>
            <ul className="mt-2 list-disc ml-4">
              <li>Markers: locations rendered with InstancedMesh for performance.</li>
              <li>Latency arcs: animated curves between exchange pairs, pulses indicate recent traffic.</li>
              <li>Heatmap: canvas overlay showing aggregated latency intensity.</li>
              <li>History: stored to <code>history.json</code> by default; optional `sql.js` WASM for sqlite via `USE_WASM_SQLITE=1`.</li>
              <li>Export: CSV export available at <code>/api/history/export</code>.</li>
            </ul>
            <div className="mt-2">Controls persist to localStorage when {'\''}Persist controls{'\''} is enabled.</div>
            {wsPolling && <div className="mt-2 text-xs text-yellow-300">Realtime connection unavailable — showing HTTP-poll fallback (mock data). Check the mock WS server or set NEXT_PUBLIC_WS_URL.</div>}
          </div>
        )}
      </div>
      <div className="mt-2">
        <label className="flex items-center text-sm">
          <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} className="mr-2" />
          Show Regions
        </label>
        <label className="flex items-center text-sm mt-1">
          <input type="checkbox" checked={lowPerfMode} onChange={(e) => setLowPerfMode(e.target.checked)} className="mr-2" />
          Low performance mode
        </label>
        <div className="mt-2 text-sm">Camera Presets:</div>
        <div className="flex gap-2 mt-1">
          <button aria-label="Camera preset Asia" onClick={() => setCameraTarget({ name: 'Asia', pos: [0.5, 0.2, 4] })} className="px-2 py-1 rounded bg-white/10 text-sm">Asia</button>
          <button aria-label="Camera preset Europe" onClick={() => setCameraTarget({ name: 'Europe', pos: [-0.8, 0.2, 4] })} className="px-2 py-1 rounded bg-white/10 text-sm">Europe</button>
          <button aria-label="Camera preset Americas" onClick={() => setCameraTarget({ name: 'Americas', pos: [0.0, 0.1, 6] })} className="px-2 py-1 rounded bg-white/10 text-sm">Americas</button>
        </div>
      </div>
      <div className="mt-2">
        <label className="text-sm">Smoothing: <span className="font-semibold">{Math.round((smoothingFactor||0)*100)}%</span></label>
        <input type="range" min="0" max="1" step="0.01" value={smoothingFactor} onChange={(e) => setSmoothingFactor(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mt-2">
        <label className="text-sm">Arc speed: <span className="font-semibold">{arcSpeed}</span></label>
        <input type="range" min="0" max="3" step="0.1" value={arcSpeed} onChange={(e) => setArcSpeed(Number(e.target.value))} className="w-full" />
      </div>
      <div className="mt-2">
        <label className="text-sm">Latency range (ms): <span className="font-semibold">{minLatency} - {maxLatency}</span></label>
        <div className="mt-1">
          {/* two-handle range slider */}
          <RangeSlider value={[minLatency, maxLatency]} onChange={(v:[number,number])=>{ setMinLatency(v[0]); setMaxLatency(v[1]); }} />
        </div>
      </div>
      <div className="mt-2">
        <label className="flex items-center text-sm">
          <input type="checkbox" checked={persistControls} onChange={(e) => setPersistControls(e.target.checked)} className="mr-2" />
          Persist controls
        </label>
      </div>
  <div className="mt-2">
  <label htmlFor="tv-search" className="text-sm">Search exchanges/locations</label>
  <input id="tv-search" aria-label="Search exchanges and locations" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // if a suggestion is focused, choose it
              if (focusedSuggestion >= 0 && suggestions[focusedSuggestion]) {
                const s = suggestions[focusedSuggestion];
                setSearchQuery([s.id, s.name].join(' '));
                setSuggestions([]);
                setCameraTarget({ name: s.id, pos: [0,0,4], focus: { lat: s.lat, lng: s.lng } });
                return;
              }
              const val = (e.target as HTMLInputElement).value || '';
              try {
                fetch('/api/locations').then((r)=>r.json()).then((data)=>{
                  const q = val.toLowerCase();
                  const found = (data||[]).find((l:any)=>[l.id,l.name,l.city,l.provider].join(' ').toLowerCase().includes(q));
                  if (found) setCameraTarget({ name: found.id, pos: [0,0,4], focus: { lat: found.lat, lng: found.lng } });
                }).catch(()=>{});
              } catch { }
            } else if (e.key === 'ArrowDown') {
              setFocusedSuggestion((n) => Math.min((suggestions.length - 1), Math.max(-1, n + 1)));
            } else if (e.key === 'ArrowUp') {
              setFocusedSuggestion((n) => Math.max(-1, n - 1));
            } else if (e.key === 'Escape') {
              setSuggestions([]);
              setFocusedSuggestion(-1);
              setSearchQuery('');
            }
        }} className="w-full mt-1 p-1 rounded text-black text-sm" placeholder="Search by name, city, id..." />
  {/* suggestions dropdown */}
      {suggestions.length > 0 && (
    <div role="listbox" aria-label="Search suggestions" className="bg-white text-black mt-1 rounded shadow max-h-48 overflow-auto text-sm">
      {suggestions.map((s, idx) => (
        <div
          id={`tv-sugg-${idx}`}
          key={`${s.id}-${idx}`}
          role="option"
          aria-selected={focusedSuggestion === idx}
          tabIndex={0}
          className={`p-2 cursor-pointer ${focusedSuggestion === idx ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => { setSearchQuery([s.id,s.name].join(' ')); setSuggestions([]); setCameraTarget({ name: s.id, pos: [0,0,4], focus: { lat: s.lat, lng: s.lng } }); }}
          onMouseEnter={() => setFocusedSuggestion(idx)}
        >
          <div className="font-semibold text-xs">{s.name} <span className="text-gray-500">{s.provider}</span></div>
          <div className="text-xs text-gray-600">{s.city} — {s.id}</div>
        </div>
      ))}
    </div>
  )}
      </div>
  <div className="mt-2">
        <div className="text-sm font-semibold">Regions</div>
        <div className="text-xs mt-1 max-h-32 overflow-auto">
          {/* fetch regions client-side */}
          <RegionList setRegionFilter={setRegionFilter} regionFilters={regionFilters} />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-sm font-semibold">Manual region assignment</div>
        <div className="text-xs mt-1">
          <ManualAssign />
        </div>
      </div>
      </>
      ) : null}
    </div>
  );
}

function RegionList({ setRegionFilter, regionFilters }: any) {
  const [regions, setRegions] = React.useState<any[]>([]);
  React.useEffect(()=>{ let m=true; fetch('/api/regions').then(r=>r.json()).then((d)=>{ if(m && d && d.features) setRegions(d.features); }).catch(()=>{}); return ()=>{m=false}; },[]);
  return (
    <div role="listbox" aria-label="Regions list">
      {regions.map((f:any)=>{
        const rawCode = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || '';
        const code = String(rawCode).trim();
        // skip clearly invalid geojson placeholder values (e.g. -99 used widely in the large geo dataset)
        if (!code || code === '-99') return null;
        const count = f.properties?.serverCount ?? 0;
        return (
          <label key={`${code}-${count}`} role="option" aria-selected={regionFilters[code] !== false} className="flex items-center text-xs" title={`Filter region ${code}`}>
            <input aria-label={`Toggle region ${code}`} type="checkbox" checked={regionFilters[code] !== false} onChange={(e)=>setRegionFilter(code, e.target.checked)} className="mr-1" />
            {code} — {count}
          </label>
        );
      })}
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
    // non-blocking confirmation: set a transient message and proceed
    setAssignMessage(`Assigning ${code} to ${id}...`);
    setBusy(true);
    try {
      const res = await fetch('/api/locations/assign', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ id, region: code }) });
      const j = await res.json();
      if (j.ok) {
        try { const list = await fetch('/api/locations').then(r=>r.json()); setUnassigned((list||[]).filter((x:any)=>!x.region_code)); } catch {}
        try { const r = await fetch('/api/regions').then(r=>r.json()); if (r && r.features) setRegions(r.features); } catch {}
        setAssignMessage('Assigned');
      } else {
        setAssignMessage('Assign failed: ' + (j.error || 'unknown'));
      }
    } catch (e) { setAssignMessage('Assign failed: ' + String(e)); }
    setBusy(false);
    setTimeout(()=>setAssignMessage(null), 3000);
  }

  return (
    <div>
  {unassigned.length === 0 ? <div className="text-xs text-gray-400">No unassigned locations</div> : (
        unassigned.map((l:any)=> (
          <div key={l.id} className="flex items-center gap-2 mb-1">
            <div className="text-xs w-28">{l.id}</div>
            <select aria-label={`Assign region to ${l.id}`} className="text-xs p-1" defaultValue="" onChange={(e)=>{ const code=e.target.value; if(code) assign(l.id, code); }}>
              <option value="">Assign region...</option>
              {regions.map((f:any, idx:number)=>{ const raw = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || ''; const code = String(raw).trim(); if (!code || code === '-99') return null; return <option key={`${code}-${idx}`} value={code}>{code}</option> })}
            </select>
          </div>
        ))
      )}
  {busy && <div className="text-xs">Assigning...</div>}
  {assignMessage && <div className="text-xs text-green-300">{assignMessage}</div>}
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
    <div className="max-h-24 overflow-auto pr-1">
      {exchanges.map((name) => (
        <label key={name} className="flex items-center text-xs">
          <input type="checkbox" className="mr-2" checked={exchangeFilters[name] !== false} onChange={(e) => setExchangeFilter(name, e.target.checked)} />
          {name}
        </label>
      ))}
    </div>
  );
}
