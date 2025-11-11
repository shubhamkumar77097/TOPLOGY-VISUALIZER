"use client";

import React, { useEffect, useState } from 'react';
import { useLatencyStore } from '@/lib/store';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function HistoryPanel() {
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  const setSelectedPair = useLatencyStore((s) => s.setSelectedPair);
  const [range, setRange] = useState<'1h'|'24h'|'7d'|'30d'>('24h');
  const [data, setData] = useState<{labels:string[], values:number[]}>({ labels: [], values: [] });
  const [pairs, setPairs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bucketMs, setBucketMs] = useState<number | null>(null);
  const [pairFilter, setPairFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<any | null>(null);
  const [seriesRaw, setSeriesRaw] = useState<any[] | null>(null);

  // stats are provided by the aggregate endpoint; client uses server stats when available

  useEffect(()=>{
    if (!selectedPair) return setData({ labels: [], values: [] });
    setError(null);
    // sensible bucket defaults per range
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
      // if server didn't provide stats, compute basic stats from series
      if (!j.stats || typeof j.stats.avg !== 'number') {
        const flat = (j.series || []).flatMap((s:any)=> Array.isArray(s.values) ? s.values : (s.avg !== null ? [s.avg] : []));
        if (flat.length) {
          const min = Math.min(...flat); const max = Math.max(...flat); const avg = flat.reduce((a:number,b:number)=>a+b,0)/flat.length;
          setServerStats({ min: Math.round(min), max: Math.round(max), avg: Math.round(avg), count: flat.length });
        } else if (Array.isArray(j.series) && j.series.length) {
          // fallback: derive from per-bucket avg values
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

    // clear explicit bucket when range changes so defaults apply
    useEffect(()=>{
      setBucketMs(null);
    }, [range]);

  // fetch available pairs for selection
  useEffect(()=>{
    let m=true;
    fetch('/api/history').then(r=>r.json()).then((arr)=>{
      if (!Array.isArray(arr)) return;
  const uniq = Array.from(new Set(arr.map((x:any)=>x.pair))).slice(0,200);
  if (m) setPairs(uniq);
    }).catch(()=>{});
    return ()=>{ m=false };
  },[]);

  if (!selectedPair) return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/70 text-white p-3 rounded text-sm">Select a pair to view history
      <div className="mt-2 text-xs">Or choose from the dropdown in the History panel.</div>
    </div>
  );

  const chartData = {
    labels: data.labels,
    datasets: [{ label: selectedPair, data: data.values, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.15)' }]
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-3 rounded w-96">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold">History</div>
        <div className="flex flex-col">
          <input placeholder="Filter pairs" value={pairFilter} onChange={(e)=> setPairFilter(e.target.value)} className="text-sm p-1 rounded bg-black/60 mb-1" />
          <select value={selectedPair ?? ''} onChange={(e)=> setSelectedPair(e.target.value || null)} className="text-sm p-1 rounded bg-black/60">
            <option value="">Select pair</option>
            {pairs.filter(p=> p.toLowerCase().includes(pairFilter.toLowerCase())).map((p)=> <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
  <div className="text-xs">Range:</div>
        <div className="flex gap-1">
          {(['1h','24h','7d','30d'] as any[]).map((r)=> (
            <button key={r} className={`px-2 py-1 text-xs rounded ${range===r? 'bg-white/10':''}`} onClick={()=>setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
  <div className="mb-2 text-xs text-gray-300">{error ? error : (serverStats ? `Min ${serverStats.min ?? '-'}ms • Avg ${serverStats.avg ?? '-'}ms • Max ${serverStats.max ?? '-'}ms • Count ${serverStats.count ?? 0}` : 'Showing aggregated averages; adjust bucket size if needed.')}</div>
    <div className="mb-2 text-xs text-gray-300">{
      error ? error : (
        serverStats ? `Min ${serverStats.min ?? '-'}ms · Avg ${serverStats.avg ?? '-'}ms · Max ${serverStats.max ?? '-'}ms · Count ${serverStats.count ?? 0}` : 'Showing aggregated averages; adjust bucket size if needed.'
      )
    }</div>
  <div className="mb-2 flex items-center gap-2">
    <div className="text-xs">Bucket:</div>
    <select value={String(bucketMs || '')} onChange={(e)=> setBucketMs(e.target.value ? Number(e.target.value) : null)} className="text-xs p-1 bg-black/60 rounded">
      <option value="">default</option>
      <option value={60000}>1m</option>
      <option value={600000}>10m</option>
      <option value={3600000}>1h</option>
      <option value={21600000}>6h</option>
    </select>
    <button className="ml-auto text-xs p-1 bg-white/10 rounded" onClick={async () => {
      // CSV export: fetch aggregated series for the current selection when possible
      try {
        const defaults: Record<string, number> = { '1h': 60 * 1000, '24h': 10 * 60 * 1000, '7d': 60 * 60 * 1000, '30d': 6 * 60 * 60 * 1000 };
        const bucket = bucketMs || defaults[range] || 60 * 1000;
        const q = new URLSearchParams({ pair: selectedPair || '', range, bucketMs: String(bucket) });
        const res = await fetch(`/api/history/aggregate?${q.toString()}`);
        const j = await res.json().catch(()=>null);
        const rows = [['start','end','count','min','avg','max']];
        if (j && j.ok && Array.isArray(j.series) && j.series.length) {
          j.series.forEach((s:any)=> rows.push([new Date(s.start).toISOString(), new Date(s.end).toISOString(), String(s.count || 0), String(s.min ?? ''), String(s.avg ?? ''), String(s.max ?? '')]));
        } else if (seriesRaw && seriesRaw.length) {
          seriesRaw.forEach((s:any)=> rows.push([new Date(s.start).toISOString(), new Date(s.end).toISOString(), String(s.count || 0), String(s.min ?? ''), String(s.avg ?? ''), String(s.max ?? '')]));
        } else {
          (data.labels || []).forEach((lbl,i)=> rows.push([lbl, '', '', '', String((data.values as any)[i] ?? ''), '']));
        }
        const csv = rows.map((r:any)=> r.map((c:any)=> String(c).replace(/"/g,'""')).map((c:any)=> `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${selectedPair || 'history'}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } catch (e) { console.error('CSV export failed', e); }
    }}>Export CSV</button>
  </div>
  <div style={{ height: 140 }}>
        {loading ? <div className="text-center text-xs text-gray-300">Loading...</div> : (
          data.labels && data.labels.length ? (
            <Line
              data={chartData}
              options={{
                animation: { duration: 200 },
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context:any) {
                        const i = context.dataIndex;
                        const s = (seriesRaw && seriesRaw[i]) || null;
                        if (s) return `avg ${s.avg ?? '-'}ms • count ${s.count ?? 0} • min ${s.min ?? '-'} • max ${s.max ?? '-'}`;
                        const v = context.formattedValue;
                        return `${v} ms`;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="text-center text-xs text-gray-400">No aggregated history for this pair and range. Try a different range or bucket size.</div>
          )
        )}
      </div>
    </div>
  );
}
