"use client";

import React, { useState } from 'react';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';
import { useLatencyStore } from '@/lib/store';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function Regions() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Simple grouping by provider - place a small translucent sphere at the average of provider points
  const providers = Array.from(new Set(locations.map((l) => l.provider)));
  const clusters = providers.map((p) => {
    const pts = locations.filter((l) => l.provider === p).map((l) => convertLatLonToVec3(l.lat, l.lng, 3));
    const avg = pts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, pts.length));
    const locs = locations.filter((l) => l.provider === p);
    const regionCodes = Array.from(new Set(locs.map((l: any) => l.region_code).filter(Boolean)));
    return { 
      provider: p, 
      position: [avg.x, avg.y, avg.z],
      serverCount: locs.length,
      regionCodes: regionCodes.join(', ') || 'N/A'
    };
  });

  const setProviderFilter = useLatencyStore((s) => s.setProviderFilter);
  const providerFilters = useLatencyStore((s) => s.providerFilters);
  const showRegions = useLatencyStore((s) => (s as any).showRegions ?? true);

  if (!showRegions) return null;

  return (
    <group>
      {clusters.map((c) => {
        if (providerFilters && providerFilters[c.provider] === false) return null;
        const isHovered = hoveredRegion === c.provider;
        const isSelected = selectedRegion === c.provider;
        
        return (
          <group key={c.provider} position={c.position as any}>
            <mesh 
              onPointerOver={(e) => { e.stopPropagation(); setHoveredRegion(c.provider); }}
              onPointerOut={(e) => { e.stopPropagation(); setHoveredRegion(null); }}
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedRegion(isSelected ? null : c.provider);
              }}
            >
              <sphereGeometry args={[isHovered || isSelected ? 0.42 : 0.35, 24, 24]} />
              <meshStandardMaterial 
                color={c.provider === 'AWS' ? '#FF9900' : c.provider === 'GCP' ? '#4285F4' : c.provider === 'Azure' ? '#0078D4' : '#9E9E9E'} 
                opacity={isHovered ? 0.35 : isSelected ? 0.4 : 0.22} 
                transparent 
                emissive={isHovered || isSelected ? '#ffffff' : '#000000'}
                emissiveIntensity={isHovered ? 0.3 : isSelected ? 0.2 : 0}
              />
            </mesh>
            {(isHovered || isSelected) && (
              <Html distanceFactor={6} center style={{ pointerEvents: 'none' }}>
                <div className="bg-black/90 text-white text-xs rounded px-3 py-2 shadow-lg border border-white/20">
                  <div className="font-bold text-sm mb-1">{c.provider}</div>
                  <div className="opacity-90">Servers: {c.serverCount}</div>
                  <div className="opacity-90">Region Codes: {c.regionCodes}</div>
                  {isSelected && <div className="mt-1 text-xs opacity-70">Click again to deselect</div>}
                </div>
              </Html>
            )}
            {!isHovered && !isSelected && (
              <Html distanceFactor={6} center style={{ pointerEvents: 'none' }}>
                <div className="bg-white/90 text-black text-xs rounded px-2 py-1">
                  {c.provider}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
