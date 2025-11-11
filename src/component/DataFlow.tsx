"use client";

import { useMemo } from 'react';
import { useLatencyStore } from '@/lib/store';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
import { PULSE_CONFIG } from '@/lib/visualConfig';

// Simple particle along an arc for each active link; not physically accurate but visually representative
export default function DataFlow() {
  const latencies = useLatencyStore((s) => s.latencies);
  const pulsesEnabled = useLatencyStore((s) => s.pulsesEnabled);
  const lowPerf = useLatencyStore((s) => (s as any).lowPerfMode);

  const links = useMemo(() => {
    return Object.values(latencies).sort((a: any,b:any)=>b.ts-a.ts).slice(0, 40).map((r:any)=>{
      const from = locations.find(l=>l.id===r.from);
      const to = locations.find(l=>l.id===r.to);
      if (!from || !to) return null;
      const p1 = convertLatLonToVec3(from.lat, from.lng, 3.02);
      const p2 = convertLatLonToVec3(to.lat, to.lng, 3.02);
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(3.03);
      const curve = new THREE.QuadraticBezierCurve3(p1,p2,mid);
      return { key: `${r.from}-${r.to}`, curve, value: r.value } as any;
    }).filter(Boolean);
  }, [latencies]);

  useFrame(({ clock })=>{
    const t = clock.getElapsedTime();
    links.forEach((l, idx)=>{
      // short-circuit on perf mode
      if (!pulsesEnabled || lowPerf) return;
      // determine a phase and position on curve
      const speed = 0.25 + Math.min(1.5, (l.value||50)/400);
      const phase = (t*speed + (idx%7)/7) % 1;
      const pos = l.curve.getPointAt(phase);
      // place a small sprite or point at pos; for performance we will use DOM overlay for now
      const id = `df-${l.key}`;
      let el = document.getElementById(id) as HTMLDivElement | null;
      if (!el) {
        el = document.createElement('div'); el.id = id; el.style.position='absolute'; el.style.width='6px'; el.style.height='6px'; el.style.borderRadius='50%'; el.style.pointerEvents='none'; el.style.background='rgba(96,165,250,0.9)'; el.style.transform='translate(-50%,-50%)';
        el.style.zIndex='9999';
        document.body.appendChild(el);
      }
      // project into screen
      try {
        const vector = pos.clone();
        vector.project((window as any).__r3f_camera__ || (window as any).camera);
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = (-vector.y + 1) / 2 * window.innerHeight;
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.opacity = String(Math.max(0.2, Math.min(1, 1 - (l.value||0)/700)));
  } catch {}
    });
  });

  return null;
}
