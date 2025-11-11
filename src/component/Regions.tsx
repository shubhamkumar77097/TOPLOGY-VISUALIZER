"use client";

import React from 'react';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
import { useLatencyStore } from '@/lib/store';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function Regions() {
  // Simple grouping by provider - place a small translucent sphere at the average of provider points
  const providers = Array.from(new Set(locations.map((l) => l.provider)));
  const clusters = providers.map((p) => {
  const pts = locations.filter((l) => l.provider === p).map((l) => convertLatLonToVec3(l.lat, l.lng, 3));
  const avg = pts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, pts.length));
    return { provider: p, position: [avg.x, avg.y, avg.z] };
  });

  const setProviderFilter = useLatencyStore((s) => s.setProviderFilter);
  const providerFilters = useLatencyStore((s) => s.providerFilters);

  return (
    <group>
      {clusters.map((c) => {
        if (providerFilters && providerFilters[c.provider] === false) return null;
        return (
          <group key={c.provider} position={c.position as any}>
            <mesh onClick={(e) => { e.stopPropagation(); setProviderFilter(c.provider, !providerFilters[c.provider]); }}>
              <sphereGeometry args={[0.35, 24, 24]} />
              <meshStandardMaterial color={c.provider === 'AWS' ? '#FF9900' : c.provider === 'GCP' ? '#4285F4' : c.provider === 'Azure' ? '#0078D4' : '#9E9E9E'} opacity={0.22} transparent />
            </mesh>
            <Html distanceFactor={6} center>
              <div className="bg-white/90 text-black text-xs rounded px-2 py-1">
                {c.provider} — {locations.filter((l) => l.provider === c.provider).length} servers
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
