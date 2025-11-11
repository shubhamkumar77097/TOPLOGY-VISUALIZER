"use client";

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useLatencyStore } from '@/lib/store';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
// useState removed; phases use phaseMapRef instead
import { LATENCY_COLORS, LATENCY_THRESHOLDS, PULSE_CONFIG, MAX_ARCS } from '@/lib/visualConfig';

const EARTH_RADIUS = 3;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function hexToRgb(hex: string) { const m = hex.replace('#',''); return { r: parseInt(m.substring(0,2),16), g: parseInt(m.substring(2,4),16), b: parseInt(m.substring(4,6),16) }; }
function rgbToHex(r:number,g:number,b:number){ return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join(''); }
function latencyColor(v: number) {
  // use configured thresholds and colors
  const green = LATENCY_COLORS.green;
  const yellow = LATENCY_COLORS.yellow;
  const red = LATENCY_COLORS.red;
  const mid = LATENCY_THRESHOLDS.green;
  const high = LATENCY_THRESHOLDS.yellow;
  if (v <= mid) {
    const t = Math.min(1, Math.max(0, v / mid));
    const g = hexToRgb(green); const y = hexToRgb(yellow);
    return rgbToHex(lerp(g.r,y.r,t), lerp(g.g,y.g,t), lerp(g.b,y.b,t));
  }
  const t = Math.min(1, Math.max(0, (v - mid) / (high - mid)));
  const y = hexToRgb(yellow); const r = hexToRgb(red);
  return rgbToHex(lerp(y.r,r.r,t), lerp(y.g,r.g,t), lerp(y.b,r.b,t));
}

export function LatencyArcs() {
  const latencies = useLatencyStore((s) => s.latencies);
  const setSelectedPair = useLatencyStore((s) => s.setSelectedPair);
  const selectedPair = useLatencyStore((s) => s.selectedPair);

  const maxLatency = useLatencyStore((s) => s.maxLatency);
  const minLatency = useLatencyStore((s) => (s as any).minLatency || 0);
  const lowPerfMode = useLatencyStore((s) => (s as any).lowPerfMode);
  const mobileMode = useLatencyStore((s) => s.mobileMode);

  const geomCacheRef = useRef<Map<string, THREE.BufferGeometry>>(new Map());
  const smoothingRef = useRef<Map<string, number>>(new Map());
  const smoothingFactor = useLatencyStore.getState().smoothingFactor ?? 0.35;
  const prevKeysRef = useRef<Set<string>>(new Set());
  const groupMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const phaseMapRef = useRef<Map<string, number>>(new Map());

  const arcs = useMemo(() => {
    const providerFilters = (useLatencyStore.getState() as any).providerFilters || {};
    const regionFilters = (useLatencyStore.getState() as any).regionFilters || {};
  // limit recent arcs for low perf/mobile to reduce CPU/GPU work
  const recentAll = Object.values(latencies).sort((a,b)=>b.ts - a.ts);
  const cap = lowPerfMode ? 12 : MAX_ARCS;
  const recent = recentAll.slice(0, Math.min(recentAll.length, cap));
  const geomCache = geomCacheRef.current;
    return recent.map((rec) => {
      const from = locations.find((l) => l.id === rec.from);
      const to = locations.find((l) => l.id === rec.to);
      if (!from || !to) return null;
      if (!providerFilters[from.provider] || !providerFilters[to.provider]) return null;
      if (regionFilters && Object.keys(regionFilters).length) {
        const fr: any = from as any; const tr: any = to as any;
        if ((fr.region_code && regionFilters[fr.region_code] === false) || (tr.region_code && regionFilters[tr.region_code] === false)) return null;
      }

  const key = `${rec.from}-${rec.to}`;
      // smoothing
  const prev = smoothingRef.current.get(key) ?? rec.value;
  const sf = smoothingFactor;
      const sm = Math.round((prev * (1 - sf) + (rec.value || 0) * sf) * 100) / 100;
      smoothingRef.current.set(key, sm);

  const p1 = convertLatLonToVec3(from.lat, from.lng, EARTH_RADIUS);
  const p2 = convertLatLonToVec3(to.lat, to.lng, EARTH_RADIUS);
  // skip invalid coordinates which can cause NaN positions in BufferGeometry
  if (!Number.isFinite(p1.x) || !Number.isFinite(p1.y) || !Number.isFinite(p1.z) || !Number.isFinite(p2.x) || !Number.isFinite(p2.y) || !Number.isFinite(p2.z)) return null;
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(EARTH_RADIUS * 1.25);
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);

      // geometry cache key by approximate radius bucket and lowPerfMode
      const radius = Math.max(0.004, sm / (lowPerfMode ? 900 : 500));
      const radiusBucket = Math.round(radius * 1000);
      const geomKey = `${key}_${radiusBucket}_${lowPerfMode ? 'low' : 'hi'}`;
      let geometry = geomCache.get(geomKey);
      let type: 'tube' | 'line' = 'tube';
      if (!geometry) {
        if (lowPerfMode) {
          // low perf: use a very simple polyline (safely filtered)
          const curveSegments = 4;
          const ptsRaw = curve.getPoints(curveSegments);
          const pts = ptsRaw.filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z));
          if (pts.length < 2) {
            geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            type = 'line';
          } else {
            geometry = new THREE.BufferGeometry().setFromPoints(pts);
            type = 'line';
          }
        } else {
          const curveSegments = mobileMode ? 20 : 36;
          const radialSegments = mobileMode ? 4 : 6;
          try {
            geometry = new THREE.TubeGeometry(curve, curveSegments, Math.max(0.002, radius), radialSegments, false);
            // verify geometry positions are finite
            const pos = (geometry as any)?.attributes?.position?.array;
            const hasNan = pos && Array.prototype.some.call(pos, (v: any) => !Number.isFinite(v));
            if (hasNan) {
              geometry.dispose?.();
              const ptsRaw = curve.getPoints(16);
              const pts = ptsRaw.filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z));
              if (pts.length < 2) {
                geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                type = 'line';
              } else {
                geometry = new THREE.BufferGeometry().setFromPoints(pts);
                type = 'line';
              }
            } else {
              type = 'tube';
            }
          } catch {
            const ptsRaw = curve.getPoints(16);
            const pts = ptsRaw.filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z));
            if (pts.length < 2) {
              geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
              type = 'line';
            } else {
              geometry = new THREE.BufferGeometry().setFromPoints(pts);
              type = 'line';
            }
          }
        }
        geomCache.set(geomKey, geometry);
      }

      return { key, geometry, value: sm, curve, type } as any;
    }).filter(Boolean).filter((x: any) => x.value <= maxLatency).filter((x: any) => x.value >= minLatency) as { key: string; geometry: THREE.BufferGeometry; value: number }[];
  }, [latencies, lowPerfMode, maxLatency, minLatency, smoothingFactor, mobileMode]);
  // cleanup: remove cached geometries that are no longer referenced by recent arcs
  React.useEffect(() => {
    const geomCache = geomCacheRef.current;
    const keepPrefixes = new Set(arcs.map((a: any) => `${a.key}_`));
    const maxCache = MAX_ARCS * 3; // keep a small buffer
    const keys = Array.from(geomCache.keys());
    // dispose older entries if cache grows too large or entries not in keepPrefixes
    for (const k of keys) {
      if (geomCache.size <= maxCache) break;
      const isKept = Array.from(keepPrefixes).some(pref => k.startsWith(pref));
      if (!isKept) {
        try { const g = geomCache.get(k); if (g && typeof g.dispose === 'function') g.dispose(); } catch {}
        geomCache.delete(k);
      }
    }
    // also trim smoothingRef for removed arcs and dispose explicit per-arc group refs
    const active = new Set(arcs.map((a:any)=>a.key));
    // dispose smoothing entries for removed keys
    Array.from(smoothingRef.current.keys()).forEach((k)=>{ if (!active.has(k)) smoothingRef.current.delete(k); });
    // release any leftover group references from previously rendered arcs
    const prevKeys = prevKeysRef.current;
    const currentKeys = new Set(arcs.map((a:any)=>a.key));
    // keys that were present before but not now
    const removed = Array.from(prevKeys).filter(k=>!currentKeys.has(k));
    if (removed.length) {
      removed.forEach((rk)=>{
        // find any cached geometry prefixes and dispose
        Array.from(geomCache.keys()).forEach((gk)=>{
          if (gk.startsWith(rk + '_')) {
            try { const g = geomCache.get(gk); if (g && typeof g.dispose === 'function') g.dispose(); } catch {}
            geomCache.delete(gk);
          }
        });
        // clear smoothingRef, phaseMap and group refs
        try { smoothingRef.current.delete(rk); } catch {}
        try { phaseMapRef.current.delete(rk); } catch {}
        try { const grp = groupMapRef.current.get(rk); if (grp) { try { grp.clear?.(); } catch {} groupMapRef.current.delete(rk); } } catch {}
      });
    }
    prevKeysRef.current = currentKeys;
  }, [arcs]);
  // apply min filter later via arcs variable mapping
  const pulsesEnabled = useLatencyStore((s) => s.pulsesEnabled);
  const arcSpeed = useLatencyStore((s) => s.arcSpeed);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // update pulse positions by modifying child positions directly
    arcs.forEach((a) => {
      const key = a.key as string;
      // ensure phase exists for this key
      if (!phaseMapRef.current.has(key)) phaseMapRef.current.set(key, Math.random());
      const phaseSeed = phaseMapRef.current.get(key) || 0;
      const group = groupMapRef.current.get(key) as THREE.Object3D | undefined || (a as any)._group;
      if (!group) return;
      const pulse = group.children[1];
      if (!pulse) return;
      if (!pulsesEnabled || lowPerfMode) {
        pulse.visible = false;
        return;
      }
      pulse.visible = true;
  // speed scaling: larger latency -> faster pulse, controlled by config
  const baseSpeed = PULSE_CONFIG.baseSpeed + Math.min(1.2, a.value / PULSE_CONFIG.latencyDivisor);
  const speed = baseSpeed * (0.5 + Math.min(2, arcSpeed));
      const phase = (t * speed + phaseSeed) % 1;
      const pt = (a as any).curve.getPointAt(phase);
      // smoothing factor depends on lowPerfMode and arcSpeed
  const smooth = Math.min(0.5, 0.08 * (1 + arcSpeed));
  pulse.position.lerp(new THREE.Vector3(pt.x, pt.y, pt.z), smooth);
  // scale pulse according to latency (clamped) and lowPerfMode using config
  const size = Math.min(PULSE_CONFIG.maxSize, Math.max(PULSE_CONFIG.minSize, (a.value || 20) / 700));
  pulse.scale.lerp(new THREE.Vector3(size, size, size), 0.25);
    });
  });

  return (
    <group>
      {arcs.map((a: any) => {
        const key = a.key as string;
        const val = a.value as number;
        const geom = a.geometry as THREE.BufferGeometry;
        const t = (a as any).type as 'tube' | 'line' | undefined;
        return (
      <group key={key} ref={(g) => { if (g) { (a as any)._group = g; groupMapRef.current.set(key, g); } else { groupMapRef.current.delete(key); } }} onClick={(e) => { e.stopPropagation(); setSelectedPair(key); }}>
            {t === 'line' ? (
              <line onPointerDown={() => {}}>
                <bufferGeometry attach="geometry" {...(geom as any)} />
                <lineBasicMaterial attach="material" color={selectedPair === key ? '#FFFFFF' : latencyColor(val)} linewidth={2} />
              </line>
            ) : (
              <mesh geometry={geom}>
                <meshStandardMaterial attach="material" color={selectedPair === key ? '#FFFFFF' : latencyColor(val)} emissive={latencyColor(val)} emissiveIntensity={selectedPair === key ? 1.2 : 0.6} roughness={0.6} metalness={0.1} />
              </mesh>
            )}

            {/* pulse sphere that moves along the curve */}
            <mesh position={[0, 0, 0]} visible={pulsesEnabled && !lowPerfMode}>
              <sphereGeometry args={[lowPerfMode ? 0.02 : 0.03, lowPerfMode ? 6 : 8, lowPerfMode ? 6 : 8]} />
              <meshStandardMaterial color={latencyColor(val)} emissive={latencyColor(val)} emissiveIntensity={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
