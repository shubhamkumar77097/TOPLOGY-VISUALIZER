"use client";

import React from 'react';
import { useLatencyStore } from '@/lib/store';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
import { Html } from '@react-three/drei';

export function PairLabel() {
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  if (!selectedPair) return null;
  // parse parts used below
  const parts = selectedPair.split('->');
  const fromId = parts[0];
  const toId = parts[1];
  const f = locations.find((l) => l.id === fromId);
  const t = locations.find((l) => l.id === toId);
  if (!f || !t) return null;
  const p1 = convertLatLonToVec3(f.lat, f.lng, 3);
  const p2 = convertLatLonToVec3(t.lat, t.lng, 3);
  const mid = p1.clone().add(p2).multiplyScalar(0.5);

  // compute stats
  const hist = useLatencyStore.getState().history[selectedPair] ?? [];
  const vals = hist.map((h:any) => h.value);
  const stats = vals.length ? { min: Math.min(...vals), max: Math.max(...vals), avg: Math.round(vals.reduce((a:any,b:any)=>a+b,0)/vals.length) } : null;

  return (
    <Html position={[mid.x, mid.y, mid.z]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
      <div className="bg-white/90 text-black text-xs rounded px-2 py-1">
        <div className="font-mono text-xs">{parts[0]} → {parts[1]}</div>
        {stats && <div className="text-xs">Min: {stats.min} ms • Avg: {stats.avg} ms • Max: {stats.max} ms</div>}
      </div>
    </Html>
  );
}
