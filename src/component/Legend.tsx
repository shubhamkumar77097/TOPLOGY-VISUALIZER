"use client";

import React, { useEffect } from "react";
import { useLatencyStore } from '@/lib/store';
import { PROVIDER_COLORS } from "@/data/locations";

const providers = Object.keys(PROVIDER_COLORS) as (keyof typeof PROVIDER_COLORS)[];

export function Legend() {
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const setProviderFilter = useLatencyStore((s) => s.setProviderFilter);
  const providerFilters = useLatencyStore((s) => s.providerFilters);

  useEffect(() => {
    fetch('/api/locations').then(r=>r.json()).then((arr)=>{
      if (!Array.isArray(arr)) return;
      const c: Record<string,number> = {};
      arr.forEach((l:any)=>{ c[l.provider] = (c[l.provider]||0)+1; });
      setCounts(c);
    }).catch(()=>{});
  }, []);

  // Simplified: Direct render, no portal, no complex mounting logic
  return (
    <div 
      className="fixed bottom-4 left-4 z-[999998] rounded-lg p-4 backdrop-blur-sm pointer-events-auto shadow-lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: '#000',
        border: '2px solid rgba(0, 0, 0, 0.2)',
        minWidth: '200px'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold" style={{ color: '#000' }}>Cloud Providers</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => providers.forEach(p => setProviderFilter(p, true))} 
            className="text-xs px-2 py-1 rounded bg-green-500 text-white"
            style={{ backgroundColor: '#16a34a', color: '#fff' }}
          >
            All
          </button>
          <button 
            onClick={() => providers.forEach(p => setProviderFilter(p, false))} 
            className="text-xs px-2 py-1 rounded bg-red-400 text-white"
            style={{ backgroundColor: '#f87171', color: '#fff' }}
          >
            None
          </button>
        </div>
      </div>
      <ul className="space-y-1">
        {providers.map((provider) => (
          <li key={provider} className="flex items-center justify-between">
            <button
              aria-pressed={!providerFilters[provider]}
              onClick={() => setProviderFilter(provider, !providerFilters[provider])}
              className={`flex items-center gap-2 px-2 py-1 rounded ${!providerFilters[provider] ? 'opacity-40' : ''}`}
              style={{ background: 'transparent', border: 'none', color: '#000' }}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: PROVIDER_COLORS[provider] }}
              ></span>
              <span style={{ color: '#000' }}>{provider}</span>
            </button>
            <div className="text-sm" style={{ color: '#666' }}>{counts[provider] ?? 0}</div>
          </li>
        ))}
        <li className="flex items-center mt-2 text-sm">
          <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#999999' }}></span>
          <span style={{ color: '#666' }}>Unassigned (no region)</span>
        </li>
      </ul>
    </div>
  );
}