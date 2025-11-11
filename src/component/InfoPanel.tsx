"use client";

import React, { useMemo } from 'react';
import { useLatencyStore } from '@/lib/store';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend as CjsLegend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, CjsLegend);

export function InfoPanel() {
  const selected = useLatencyStore((s) => s.selectedLocation);
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  const allHistory = useLatencyStore((s) => s.history);
  const [range, setRange] = React.useState<'1h'|'24h'|'7d'|'30d'>('1h');
  const [remoteHistory, setRemoteHistory] = React.useState<any[] | null>(null);
  const [now, setNow] = React.useState<number>(0);

  // update 'now' when selection or range changes so we avoid calling Date.now() during render
  React.useEffect(() => {
    setNow(Date.now());
  }, [selectedPair, range]);

  React.useEffect(() => {
    let mounted = true;
    if (!selectedPair) { setRemoteHistory(null); return; }
    if (!now) return; // wait until now is set by effect above
    const fromTs = now - (range === '1h' ? 3600e3 : range === '24h' ? 24 * 3600e3 : range === '7d' ? 7 * 24 * 3600e3 : 30 * 24 * 3600e3);
    const url = `/api/history?pair=${encodeURIComponent(selectedPair)}&from=${fromTs}&to=${now}`;
    fetch(url).then((r) => r.json()).then((data) => { if (mounted) setRemoteHistory(Array.isArray(data) ? data : []); }).catch(() => { if (mounted) setRemoteHistory(null); });
    return () => { mounted = false; };
  }, [selectedPair, range, now]);

  // If a pair is selected, show pair history. Otherwise show location-centric history.
  const history = React.useMemo(() => {
    if (selectedPair) {
      const arr = remoteHistory ?? (allHistory[selectedPair] ?? []);
      return arr.slice().sort((a: any, b: any) => a.ts - b.ts);
    }
    if (!selected) return [] as any[];
    const entries: any[] = [];
    Object.values(allHistory).forEach((arr: any[]) => {
      arr.forEach((rec) => {
        if (rec.from === selected || rec.to === selected) entries.push(rec);
      });
    });
    entries.sort((a, b) => a.ts - b.ts);
    return entries;
  }, [selected, selectedPair, allHistory, remoteHistory]);

  

  const stats = useMemo(() => {
    if (!history.length) return null;
    const vals = history.map((h) => h.value);
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    };
  }, [history]);

  // apply time range filter
  const rangeFiltered = React.useMemo(() => {
    const cutoff = now - (range === '1h' ? 3600e3 : range === '24h' ? 24 * 3600e3 : range === '7d' ? 7 * 24 * 3600e3 : 30 * 24 * 3600e3);
    return history.filter((h) => h.ts >= cutoff);
  }, [history, range, now]);

  const dataForChart = React.useMemo(() => {
    const labels = rangeFiltered.map((h) => new Date(h.ts).toLocaleTimeString());
    const values = rangeFiltered.map((h) => h.value);
    return { labels, datasets: [{ label: 'Latency (ms)', data: values, borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)', tension: 0.3 }] };
  }, [rangeFiltered]);

  const exportCSV = () => {
    if ((!selected && !selectedPair) || history.length === 0) return;
    const rows = [['from', 'to', 'value', 'ts']];
    rangeFiltered.forEach((h) => rows.push([h.from, h.to, String(h.value), new Date(h.ts).toISOString()]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  a.download = `${selected || selectedPair}-latency-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-72 max-w-[90vw] bg-black/70 text-white p-3 rounded shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Info</h4>
        <div className="text-xs text-gray-300">{selected ? 'Location' : selectedPair ? 'Pair' : ''}</div>
      </div>
      {selected ? (
        <div>
          <div className="text-sm mt-2">Selected: <span className="font-semibold">{selected}</span></div>
          {/* fetch basic location info client-side */}
          <LocationSummary id={selected} />
          <div className="text-xs mt-2 text-gray-300">History points: {history.length}</div>
          {stats && (
            <div className="text-xs mt-2">Min: {stats.min} ms • Avg: {stats.avg} ms • Max: {stats.max} ms</div>
          )}
          <div className="mt-2">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setRange('1h')} className={`px-2 py-1 rounded text-sm ${range==='1h'?'bg-blue-600':''}`}>1h</button>
              <button onClick={() => setRange('24h')} className={`px-2 py-1 rounded text-sm ${range==='24h'?'bg-blue-600':''}`}>24h</button>
              <button onClick={() => setRange('7d')} className={`px-2 py-1 rounded text-sm ${range==='7d'?'bg-blue-600':''}`}>7d</button>
              <button onClick={() => setRange('30d')} className={`px-2 py-1 rounded text-sm ${range==='30d'?'bg-blue-600':''}`}>30d</button>
            </div>
            <div style={{ height: 110 }}>
              <Line data={dataForChart} options={{ responsive: true, maintainAspectRatio: false }} height={110} />
            </div>
          </div>
          <div className="mt-2">
            <button onClick={exportCSV} className="bg-blue-600 px-3 py-1 rounded text-sm">Export CSV</button>
          </div>
        </div>
      ) : (
        <div>
          {selectedPair ? (
            <div className="text-sm mt-2">Selected pair: {selectedPair}</div>
          ) : (
            <div className="text-sm mt-2">No selection</div>
          )}
        </div>
      )}
    </div>
  );
}

function LocationSummary({ id }: { id: string }) {
  const [info, setInfo] = React.useState<any | null>(null);
  React.useEffect(() => {
    let m = true;
    fetch('/api/locations').then((r) => r.json()).then((arr) => { if (m) setInfo((arr || []).find((x:any) => x.id === id) || null); }).catch(() => {});
    return () => { m = false; };
  }, [id]);
  if (!info) return null;
  return (
    <div className="text-xs mt-2">
      <div>Exchange: <span className="font-semibold">{info.name}</span></div>
      <div>City: {info.city}</div>
      <div>Provider: {info.provider} {info.region_code ? `• ${info.region_code}` : ''}</div>
    </div>
  );
}
