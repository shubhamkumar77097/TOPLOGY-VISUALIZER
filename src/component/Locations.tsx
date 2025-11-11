// src/components/Locations.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
// we'll mount an offscreen accessible list directly to document.body via an imperative effect
import * as THREE from "three";
import { Html } from "@react-three/drei";
// Reverting to the standard '@/' path alias for consistency
import { PROVIDER_COLORS } from "@/data/locations";
import { convertLatLonToVec3 } from "@/lib/utils";
import { useLatencyStore } from "@/lib/store";

// Define the radius of our Earth sphere
const EARTH_RADIUS = 3;

// fallback static list (kept small so it's safe to bundle)
const FALLBACK_LOCATIONS = [
  { id: 'binance-aws-tokyo', name: 'Binance', city: 'Tokyo', lat: 35.6895, lng: 139.6917, provider: 'AWS' },
  { id: 'bybit-aws-singapore', name: 'Bybit', city: 'Singapore', lat: 1.3521, lng: 103.8198, provider: 'AWS' },
  { id: 'deribit-gcp-netherlands', name: 'Deribit', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, provider: 'GCP' },
  { id: 'okx-azure-hongkong', name: 'OKX', city: 'Hong Kong', lat: 22.3193, lng: 114.1694, provider: 'Azure' },
  { id: 'coinbase-other-usa', name: 'Coinbase', city: 'N. Virginia', lat: 38.8339, lng: -77.17, provider: 'Other' },
];

export function Locations() {
  const [fetchedLocations, setFetchedLocations] = React.useState<any[] | null>(null);
  React.useEffect(() => {
    let mounted = true;
    fetch('/api/locations').then((r) => r.json()).then((data) => { if (mounted && Array.isArray(data)) setFetchedLocations(data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  const setSelected = useLatencyStore((s) => s.setSelectedLocation);
  const providerFilters = useLatencyStore((s) => s.providerFilters);
  const regionFilters = useLatencyStore((s) => (s as any).regionFilters || {});
  const latencies = useLatencyStore((s) => s.latencies);
  const searchQuery = useLatencyStore((s) => s.searchQuery);
  const mobileMode = useLatencyStore((s) => s.mobileMode);
  const lowPerfMode = useLatencyStore((s) => (s as any).lowPerfMode);

  const allLocations = fetchedLocations ?? FALLBACK_LOCATIONS;
  // cache positions and base colors to avoid repeated heavy math
  const enriched = useMemo(() => {
    return allLocations.map((loc) => {
      const pos = convertLatLonToVec3(loc.lat, loc.lng, EARTH_RADIUS);
      const baseHex = PROVIDER_COLORS[loc.provider as keyof typeof PROVIDER_COLORS] as unknown as string;
      return { ...loc, pos, baseHex };
    });
  }, [allLocations]);
  // For instancing, build a flat list of visible locations filtered by provider + search
  let visible = enriched.filter((loc) => {
    if (!providerFilters[loc.provider]) return false;
    if (loc.region_code && regionFilters && Object.keys(regionFilters).length && regionFilters[loc.region_code] === false) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return [loc.id, loc.name, loc.city, loc.provider].join(' ').toLowerCase().includes(q);
    }
    return true;
  });
  // cap visible count on low perf mode
  if (lowPerfMode && visible.length > 60) visible = visible.slice(0, 60);
  else if (mobileMode && visible.length > 80) visible = visible.slice(0, 80);

  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());
  const instanceColorBufferRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const now = Date.now();
    const minDelta = lowPerfMode ? 1500 : (mobileMode ? 400 : 60); // throttle more on mobile, much more on low perf
    if (now - lastUpdateRef.current < minDelta) return;
    lastUpdateRef.current = now;

    const mesh = meshRef.current!;
    const dummy = dummyRef.current;
    const tmpColor = colorRef.current;

    // precompute latest latency per location to avoid repeated array filters
    const latestMap: Record<string, number> = {};
    Object.values(latencies).forEach((r) => {
      latestMap[r.from] = r.value;
      latestMap[r.to] = r.value;
    });

    visible.forEach((loc, i) => {
      // base color
      const baseCol = tmpColor.setHex(Number('0x' + (loc.baseHex?.replace('#','') || 'ffffff')));
      if (!(loc as any).region_code) baseCol.lerp(new THREE.Color(0.6, 0.6, 0.6), 0.6);
      const latest = latestMap[loc.id] ?? 0;
      const t = Math.min(1, (latest || 0) / 200);
      const r = baseCol.r * (1 - t) + (0.9 * t + 0.1 * baseCol.r);
      const g = baseCol.g * (1 - t) + (0.2 * t + 0.8 * baseCol.g);
      const b = baseCol.b * (1 - t) + (0.2 * t + 0.8 * baseCol.b);
      tmpColor.setRGB(r, g, b);

      if (!lowPerfMode) {
        if (typeof (mesh as any).setColorAt === 'function') {
          try { (mesh as any).setColorAt(i, tmpColor); } catch {}
        } else {
          if (!instanceColorBufferRef.current || instanceColorBufferRef.current.length !== visible.length * 3) {
            instanceColorBufferRef.current = new Float32Array(visible.length * 3);
            mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColorBufferRef.current, 3));
          }
          const buf = instanceColorBufferRef.current;
          buf[i * 3] = tmpColor.r; buf[i * 3 + 1] = tmpColor.g; buf[i * 3 + 2] = tmpColor.b;
          const attr = mesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute;
          attr.needsUpdate = true;
        }
      }

      // position/scale
      const pos = loc.pos;
      const scale = latest ? Math.max(0.6, 1.8 - Math.min(500, latest) / 300) : (lowPerfMode ? 0.7 : 1);
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.count = visible.length;
    mesh.instanceMatrix.needsUpdate = true;
    if ((mesh as any).instanceColor) (mesh as any).instanceColor.needsUpdate = true;
  }, [visible, latencies, meshRef, mobileMode, lowPerfMode]);
  // Offscreen accessible list of locations for screen readers and keyboard users.
  // We create and manage this DOM node imperatively so we don't return raw DOM
  // elements or a portal from inside the Canvas render tree (that causes R3F
  // to attempt to treat DOM tags like <li> as THREE objects).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const mount = document.createElement('div');
    mount.setAttribute('aria-hidden', 'false');
    mount.className = 'sr-only';
    const ul = document.createElement('ul');
    try {
      allLocations.forEach((l: any) => {
        const li = document.createElement('li');
        li.id = `loc-${l.id}`;
        li.textContent = `${l.name} — ${l.city} — ${l.provider}`;
        ul.appendChild(li);
      });
    } catch {
      // best-effort: if building the list fails, keep mount empty
    }
    mount.appendChild(ul);
    document.body.appendChild(mount);
    return () => {
      try { document.body.removeChild(mount); } catch {};
    };
  }, [allLocations]);

  return (
    <group>
      {!lowPerfMode ? (
        <instancedMesh ref={meshRef as any} args={[undefined as any, undefined as any, visible.length]} onPointerMove={(e:any)=>{e.stopPropagation(); const id=visible[e.instanceId]?.id; if(id){ setHoveredId(id); const pos = convertLatLonToVec3(visible[e.instanceId].lat, visible[e.instanceId].lng, EARTH_RADIUS); setHoverPos([pos.x,pos.y,pos.z]); } }} onPointerOut={(e:any)=>{e.stopPropagation(); setHoveredId(null); setHoverPos(null); }} onClick={(e:any)=>{e.stopPropagation(); const id=visible[e.instanceId]?.id; if(id) setSelected(id); }}>
          {/* reduced segment counts and radius on mobile to save GPU */}
          <sphereGeometry args={[mobileMode ? 0.07 : 0.12, mobileMode ? 6 : 10, mobileMode ? 6 : 10]} />
          <meshStandardMaterial vertexColors={true} toneMapped={false} />
        </instancedMesh>
      ) : (
        // lowPerfMode: render as simple Points to reduce GPU cost
        <points onPointerMove={(e:any)=>{e.stopPropagation(); const idx = Math.floor((e.offsetX / (e.target?.width||1)) * visible.length); const id = visible[idx]?.id; if(id){ setHoveredId(id); const pos = convertLatLonToVec3(visible[idx].lat, visible[idx].lng, EARTH_RADIUS); setHoverPos([pos.x,pos.y,pos.z]); } }} onPointerOut={(e:any)=>{e.stopPropagation(); setHoveredId(null); setHoverPos(null); }} onClick={(e:any)=>{e.stopPropagation(); const idx = Math.floor((e.offsetX / (e.target?.width||1)) * visible.length); const id = visible[idx]?.id; if(id) setSelected(id); }}>
          {/* build compact buffers for Points; cap count */}
          <bufferGeometry>
            {(() => {
              const cap = Math.min(visible.length, mobileMode ? 80 : 120);
              const posArr = new Float32Array(cap * 3);
              const colArr = new Float32Array(cap * 3);
              visible.forEach((loc, i) => {
                if (i >= cap) return;
                const p = loc.pos;
                posArr[i * 3] = p.x; posArr[i * 3 + 1] = p.y; posArr[i * 3 + 2] = p.z;
                // convert hex to rgb normalized
                const hex = loc.baseHex || '#ffffff';
                const bigint = parseInt(hex.replace('#',''), 16);
                const r = ((bigint >> 16) & 255) / 255;
                const g = ((bigint >> 8) & 255) / 255;
                const b = (bigint & 255) / 255;
                colArr[i * 3] = r; colArr[i * 3 + 1] = g; colArr[i * 3 + 2] = b;
              });
              return [
                <bufferAttribute key="p" attach="attributes-position" args={[posArr, 3]} />,
                <bufferAttribute key="c" attach="attributes-color" args={[colArr, 3]} />,
              ];
            })()}
          </bufferGeometry>
          <pointsMaterial size={mobileMode ? 5 : 7} vertexColors={true} sizeAttenuation={true} />
        </points>
      )}

      {hoverPos && hoveredId && (
        <Html position={hoverPos as any} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div role="tooltip" aria-hidden={false} className="bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {(() => {
              const loc = allLocations.find((l: any) => l.id === hoveredId);
              if (!loc) return null;
              return (
                <div>
                  <div className="font-semibold">{loc.name}</div>
                  <div className="text-xs opacity-80">{loc.city} • {loc.provider}</div>
                </div>
              );
            })()}
          </div>
        </Html>
      )}

  </group>
  );
}