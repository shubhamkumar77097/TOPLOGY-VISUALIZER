"use client";
import React, { useEffect, useRef } from 'react';
import { locations } from '@/data/locations';
import { useLatencyStore } from '@/lib/store';
import { convertLatLonToVec3 } from '@/lib/utils';
import { Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function projectToScreen(v: Vector3, camera: any, size: { width: number; height: number }) {
  const pv = v.clone();
  pv.project(camera);
  return { x: (pv.x + 1) / 2 * size.width, y: (-pv.y + 1) / 2 * size.height };
}

export default function Topology() {
  const latencies = useLatencyStore((s) => s.latencies);
  const show = useLatencyStore((s) => (s as any).showTopology ?? true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const three = useThree();

  useEffect(() => {
    if (!show) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
        // Build simple top N links from recent latencies
    const recs = Object.values(latencies).sort((a: any, b: any) => b.ts - a.ts).slice(0, 30);
    const links = recs.map((r: any) => {
      const from = locations.find((l) => l.id === r.from);
      const to = locations.find((l) => l.id === r.to);
      if (!from || !to) return null;
      const v1 = convertLatLonToVec3(from.lat, from.lng, 3.01);
      const v2 = convertLatLonToVec3(to.lat, to.lng, 3.01);
      const p1 = projectToScreen(v1, three.camera, { width: rect.width, height: rect.height });
      const p2 = projectToScreen(v2, three.camera, { width: rect.width, height: rect.height });
      return { p1, p2, value: r.value };
    }).filter(Boolean);
        // render into the container div (managed by Html fullscreen) as an SVG overlay
    el.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(rect.width));
    svg.setAttribute('height', String(rect.height));
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.pointerEvents = 'none';
    links.forEach((l:any)=>{
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', String(l.p1.x)); line.setAttribute('y1', String(l.p1.y));
      line.setAttribute('x2', String(l.p2.x)); line.setAttribute('y2', String(l.p2.y));
      const w = Math.max(0.5, Math.min(3, 3 - (l.value/300)));
      line.setAttribute('stroke-width', String(w));
      line.setAttribute('stroke', l.value < 120 ? '#10b981' : l.value < 300 ? '#f59e0b' : '#ef4444');
      line.setAttribute('stroke-opacity', '0.7');
      svg.appendChild(line);
    });
    el.appendChild(svg);
  }, [latencies, show, three.camera]);

  if (!show) return null;
    // Use <Html fullscreen> so children are rendered into the DOM overlay
    // and not treated as three-fiber declarative objects (avoids "Div is not part of THREE namespace" errors).
    return (
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </Html>
    );
}
