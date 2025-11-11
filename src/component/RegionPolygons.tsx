"use client";

import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
import { useLatencyStore } from '@/lib/store';

export function RegionPolygons() {
  const providers = Array.from(new Set(locations.map((l) => l.provider)));
  const show = useLatencyStore((s) => (s as any).showRegions ?? true);
  if (!show) return null;

  const clusters = providers.map((p) => {
    const pts = locations.filter((l) => l.provider === p).map((l) => convertLatLonToVec3(l.lat, l.lng, 3));
    const avg = pts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, pts.length));
    return { provider: p, pos: avg };
  });

  return (
    <group>
      {clusters.map((c) => (
        <group key={c.provider} position={[c.pos.x, c.pos.y, c.pos.z] as any}>
          <mesh rotation={[0, 0, 0]}>
            <circleGeometry args={[0.6, 32]} />
            <meshStandardMaterial color={c.provider === 'AWS' ? '#FF9900' : c.provider === 'GCP' ? '#4285F4' : c.provider === 'Azure' ? '#0078D4' : '#9E9E9E'} transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
          <Html distanceFactor={6} center>
            <div className="bg-white/90 text-black text-xs rounded px-2 py-1">{c.provider}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}
