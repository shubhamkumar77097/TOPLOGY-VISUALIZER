"use client";

import React from 'react';
import { Stats } from '@react-three/drei';
import { useLatencyStore } from '@/lib/store';

export default function PerformanceMetrics() {
  const wsStatus = useLatencyStore((s) => s.wsStatus);
  const latencies = useLatencyStore((s) => s.latencies);

  return (
    <>
  <Stats />
    </>
  );
}

// Separate DOM overlay so it can be rendered outside the Canvas
export function PerformanceOverlay() {
  const wsStatus = useLatencyStore((s) => s.wsStatus);
  const latencies = useLatencyStore((s) => s.latencies);
  return (
    <div className="fixed left-4 bottom-4 z-50 bg-black/70 text-white p-3 rounded text-sm max-w-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>WS: <span className="font-semibold">{wsStatus}</span></div>
        <div>Pairs: <span className="font-semibold">{Object.keys(latencies).length}</span></div>
      </div>
    </div>
  );
}
