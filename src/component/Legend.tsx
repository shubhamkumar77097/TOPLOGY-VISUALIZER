"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLatencyStore } from '@/lib/store';
// Reverting to the standard '@/' path alias for consistency
import { PROVIDER_COLORS } from "@/data/locations";

// Get the provider names from our color map
const providers = Object.keys(PROVIDER_COLORS) as (keyof typeof PROVIDER_COLORS)[];

// FIX: Removed the extra period after the parentheses
export function Legend() {
  const [mounted, setMounted] = React.useState(false);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const setProviderFilter = useLatencyStore((s) => s.setProviderFilter);
  const providerFilters = useLatencyStore((s) => s.providerFilters);

  useEffect(() => {
     
    setMounted(true);
    fetch('/api/locations').then(r=>r.json()).then((arr)=>{
      if (!Array.isArray(arr)) return;
      const c: Record<string,number> = {};
      arr.forEach((l:any)=>{ c[l.provider] = (c[l.provider]||0)+1; });
      setCounts(c);
    }).catch(()=>{});
  }, []);

  const legend = (
    <>
      {/* Bright debug banner to verify rendering */}
      <div className="fixed top-4 left-4 z-[99999] rounded px-3 py-1 bg-pink-600 text-white font-bold pointer-events-none">
        LEGEND MOUNTED
      </div>

      <div className="fixed bottom-4 left-4 z-[99999] rounded-lg bg-white/90 p-4 text-black backdrop-blur-sm pointer-events-auto shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Cloud Providers</h3>
          <div className="flex gap-2">
            <button onClick={() => providers.forEach(p => setProviderFilter(p, true))} className="text-xs px-2 py-1 rounded bg-green-500 text-white">All</button>
            <button onClick={() => providers.forEach(p => setProviderFilter(p, false))} className="text-xs px-2 py-1 rounded bg-red-400 text-white">None</button>
          </div>
        </div>
        <ul className="space-y-1">
          {providers.map((provider) => (
            <li key={provider} className="flex items-center justify-between">
              <button
                aria-pressed={!providerFilters[provider]}
                onClick={() => setProviderFilter(provider, !providerFilters[provider])}
                className={`flex items-center gap-2 px-2 py-1 rounded ${!providerFilters[provider] ? 'opacity-40' : ''}`}
                style={{ background: 'transparent', border: 'none' }}
              >
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                ></span>
                <span>{provider}</span>
              </button>
              <div className="text-sm text-gray-600">{counts[provider] ?? 0}</div>
            </li>
          ))}
          <li className="flex items-center mt-2 text-sm text-gray-700">
            <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#999999' }}></span>
            <span>Unassigned (no region)</span>
          </li>
        </ul>
      </div>
    </>
  );

  // During SSR and the initial hydration pass we must render the same
  // output as the server to avoid hydration mismatches. So return null
  // until the component has mounted on the client, then create the portal.
  if (!mounted) return null;

  return createPortal(legend, document.body);
}