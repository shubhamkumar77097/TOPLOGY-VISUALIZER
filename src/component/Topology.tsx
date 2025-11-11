"use client";
import React, { useEffect, useRef } from 'react';
import { locations } from '@/data/locations';
import { useLatencyStore } from '@/lib/store';
import { convertLatLonToVec3 } from '@/lib/utils';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function projectToScreen(v: THREE.Vector3, camera: any, size: { width: number; height: number }) {
  const pv = v.clone();
  pv.project(camera);
  return { x: (pv.x + 1) / 2 * size.width, y: (-pv.y + 1) / 2 * size.height };
}

function TopologyOverlay({ camera }: { camera: THREE.Camera }) {
  const latencies = useLatencyStore((s) => s.latencies);
  const show = useLatencyStore((s) => (s as any).showTopology ?? true);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      const p1 = projectToScreen(v1, camera, { width: rect.width, height: rect.height });
      const p2 = projectToScreen(v2, camera, { width: rect.width, height: rect.height });
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
    // create defs for animated dash style
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    const style = document.createElementNS('http://www.w3.org/2000/svg','style');
    style.textContent = `
      .topo-line { stroke-linecap: round; stroke-dasharray: 8 6; stroke-dashoffset: 0; transition: stroke-opacity 160ms ease; }
      .topo-line.animate { animation: dashmove 2s linear infinite; }
      .topo-line.highlight { stroke-width: 4 !important; stroke-opacity: 1 !important; }
      @keyframes dashmove { to { stroke-dashoffset: -32; } }
    `;
    defs.appendChild(style);
    svg.appendChild(defs);
    links.forEach((l:any, idx:number)=>{
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('class','topo-line');
      line.setAttribute('data-idx', String(idx));
      line.setAttribute('x1', String(l.p1.x)); line.setAttribute('y1', String(l.p1.y));
      line.setAttribute('x2', String(l.p2.x)); line.setAttribute('y2', String(l.p2.y));
      const w = Math.max(0.5, Math.min(3, 3 - (l.value/300)));
      line.setAttribute('stroke-width', String(w));
      line.setAttribute('stroke', l.value < 120 ? '#10b981' : l.value < 300 ? '#f59e0b' : '#ef4444');
      line.setAttribute('stroke-opacity', '0.7');
      // animate heavier traffic lines
      if (l.value < 200) line.classList.add('animate');
      svg.appendChild(line);
    });
    // simple mouse tracking to highlight nearest line
    let lastHighlight: SVGElement | null = null;
    function onMove(e: MouseEvent) {
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      let nearest: Element | null = null; let best = Infinity;
      const nodes = svg.querySelectorAll('line.topo-line');
      nodes.forEach((ln) => {
        const el = ln as SVGLineElement;
        const x1 = Number(el.getAttribute('x1')); const y1 = Number(el.getAttribute('y1'));
        const x2 = Number(el.getAttribute('x2')); const y2 = Number(el.getAttribute('y2'));
        // distance from point to segment
        const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
        const dot = A * C + B * D;
        const len_sq = C*C + D*D;
        const param = len_sq !== 0 ? Math.max(0, Math.min(1, dot / len_sq)) : -1;
        const xx = x1 + param * C; const yy = y1 + param * D;
        const dist = Math.hypot(x - xx, y - yy);
        if (dist < best && dist < 16) { best = dist; nearest = el; }
      });
      if (lastHighlight && lastHighlight !== nearest) (lastHighlight as Element).classList.remove('highlight');
      if (nearest && lastHighlight !== nearest) (nearest as Element).classList.add('highlight');
      lastHighlight = nearest as SVGElement | null;
    }
    svg.addEventListener('mousemove', onMove);
    el.appendChild(svg);
    // cleanup handler when effect re-runs
    return () => { try { svg.removeEventListener('mousemove', onMove); } catch {} };
  }, [latencies, show, camera]);

  if (!show) return null;

  return (
    <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

export default function Topology() {
  const { camera } = useThree();
  const showTopology = (useLatencyStore.getState() as any).showTopology ?? true;
  if (!showTopology) return null;
  return (
    <Html fullscreen>
      <TopologyOverlay camera={camera} />
    </Html>
  );
}
