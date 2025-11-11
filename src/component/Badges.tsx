"use client";

import React from 'react';
import { useLatencyStore } from '@/lib/store';

export function SelectionBadge() {
  const selectedPair = useLatencyStore((s) => s.selectedPair);
  const setSelectedPair = useLatencyStore((s) => s.setSelectedPair);

  if (!selectedPair) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 p-2 rounded flex items-center gap-2" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-fg)' }}>
      <div className="text-sm">Selected: <span className="font-mono">{selectedPair}</span></div>
      <button className="text-xs bg-red-500 text-white px-2 py-1 rounded" onClick={() => setSelectedPair(null)}>Clear</button>
    </div>
  );
}

export function StatusBadge() {
  const ws = useLatencyStore((s) => s.wsStatus);
  const color = ws === 'connected' ? 'bg-green-500' : ws === 'connecting' ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={`fixed top-4 right-4 z-50 text-white px-2 py-1 rounded ${color}`}>{ws.toUpperCase()}</div>
  );
}
