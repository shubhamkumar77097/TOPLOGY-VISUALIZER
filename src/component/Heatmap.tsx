"use client";
import React, { useEffect, useRef } from 'react';
import { useLatencyStore } from '@/lib/store';
import { locations } from '@/data/locations';

function latLngToXY(lat: number, lng: number, width: number, height: number) {
  // equirectangular projection: x = (lng+180)/360 * w ; y = (90-lat)/180 * h
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

export function Heatmap({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latencies = useLatencyStore((s) => s.latencies);
  const visible = useLatencyStore((s) => s.providerFilters);
  const lastDraw = useRef(0);
  const lowPerfMode = useLatencyStore((s) => (s as any).lowPerfMode);
  const mobileMode = useLatencyStore((s) => s.mobileMode);

  useEffect(() => {
  const cnv = canvasRef.current;
    if (!cnv) return;
  const dpr = (lowPerfMode || mobileMode) ? 1 : window.devicePixelRatio || 1;
  const w = cnv.clientWidth;
  const h = cnv.clientHeight;
  // reduce internal resolution on mobile/low perf
  cnv.width = Math.floor(w * dpr * (mobileMode ? 0.8 : 1));
  cnv.height = Math.floor(h * dpr * (mobileMode ? 0.8 : 1));
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
  // throttle redraws more aggressively on lowPerf/mobile
  const now = performance.now();
  const throttleMs = lowPerfMode ? 500 : mobileMode ? 120 : 66;
  if (now - lastDraw.current < throttleMs) return;
  lastDraw.current = now;
  ctx.clearRect(0, 0, cnv.width, cnv.height);

    // accumulate simple intensity per location based on recent related latencies
    const accum: { x: number; y: number; value: number }[] = [];
    locations.forEach((loc) => {
      if (!visible[loc.provider]) return;
      const related = Object.values(latencies).filter((r: any) => r.from === loc.id || r.to === loc.id);
      const latest = related.length ? related[related.length - 1].value : 0;
      if (!latest) return;
      const t = Math.min(1, latest / 300);
      const [x, y] = latLngToXY(loc.lat, loc.lng, cnv.width, cnv.height);
      accum.push({ x, y, value: t });
    });

    // draw gaussian-like blobs; skip if low perf to conserve CPU
    if (!lowPerfMode) {
      accum.forEach((p) => {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 120 * dpr);
        const c = Math.min(1, p.value * intensity);
        // color from green->yellow->red
        const color = c < 0.4
          ? `rgba(0,${Math.floor(200 * c + 55)},0,${0.4 * c})`
          : c < 0.8
            ? `rgba(${Math.floor(255 * c)},${Math.floor(200 * (1 - c))},0,${0.45 * c})`
            : `rgba(255,${Math.floor(80 * (1 - c))},${Math.floor(40 * (1 - c))},${0.5 * c})`;
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad as any;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 120 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
    }

  // no-op: keep cheap rendering path; offscreen canvas support could be added here
  try { ctx.globalCompositeOperation = 'source-over'; } catch {}
  }, [latencies, visible, intensity, lowPerfMode, mobileMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: 'screen' }}
    />
  );
}

export default Heatmap;
