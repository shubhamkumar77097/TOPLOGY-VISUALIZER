"use client";

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import earcut from 'earcut';
// don't statically import the large provider-regions.json to keep client bundle small
// use a tiny sample only when API failover occurs
import regionsGeo from '@/data/regions.sample';
import { convertLatLonToVec3 } from '@/lib/utils';
import { useLatencyStore } from '@/lib/store';

const R = 3.01; // slightly above globe surface

function coordsToMesh(pts: number[][]) {
  // pts is array of [lng, lat]
  const verts: number[] = [];
  pts.forEach(([lng, lat]) => {
    const v = convertLatLonToVec3(lat, lng, R);
    // skip invalid coordinates
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) return;
    verts.push(v.x, v.y, v.z);
  });
  // earcut expects 2D coordinates; project to lat/lon plane using simple equirect
  const flat: number[] = [];
  pts.forEach(([lng, lat]) => { flat.push(lng, lat); });
  const indices = earcut(flat);
  if (verts.length < 9) {
    // not enough vertices for a triangle
    return null as any;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices as any);
  geometry.computeVertexNormals();
  return geometry;
}

const RegionBoundaries: React.FC = () => {
  const show = useLatencyStore((s) => (s as any).showRegions ?? true);
  const showEmptyRegions = useLatencyStore((s) => (s as any).showEmptyRegions ?? false);
  const setRegionFilter = useLatencyStore((s) => (s as any).setRegionFilter);
  const hoveredRegion = useLatencyStore((s) => (s as any).hoveredRegion);
  const setHoveredRegion = useLatencyStore((s) => (s as any).setHoveredRegion);

  const [features, setFeatures] = React.useState<any[] | null>(null);
  React.useEffect(() => {
    let mounted = true;
    // fetch regions lazily from server API; large file only transferred when requested
    fetch('/api/regions').then((r) => r.json()).then((data) => { if (mounted && data && data.features) setFeatures(data.features); }).catch(() => { setFeatures((regionsGeo as any).features || []); });
    return () => { mounted = false; };
  }, []);
  type MeshItem = { geometry: THREE.BufferGeometry; color: string; props: any };
  const meshes: MeshItem[] = useMemo(() => {
    const useFeatures = features ?? (regionsGeo as any).features ?? [];
    return useFeatures.map((f: any) => {
      const coords = (f.geometry && f.geometry.coordinates && f.geometry.coordinates[0]) ? f.geometry.coordinates[0] as number[][] : [];
      const geometry = coordsToMesh(coords);
      if (!geometry) return null as any;
      const color = f.properties.provider === 'AWS' ? '#FF9900' : f.properties.provider === 'GCP' ? '#4285F4' : '#0078D4';
      return { geometry, color, props: f.properties } as MeshItem;
    }).filter(Boolean) as MeshItem[];
  }, [features]);

  if (!show) return null;
  if (!features) return null; // still loading

  return (
    <group>
      {meshes.map((m, i) => {
        const providerFilters = (useLatencyStore.getState() as any).providerFilters || {};
        if (providerFilters && providerFilters[m.props.provider] === false) return null;
        
        // Filter out regions with 0 servers if showEmptyRegions is false
        const serverCount = m.props.serverCount ?? (Array.isArray((m.props as any).members) ? (m.props as any).members.length : 0);
        if (serverCount === 0 && !showEmptyRegions) return null;
        
        return (
        <group key={i}>
            <mesh
            onPointerOver={(e) => { e.stopPropagation(); try { setHoveredRegion(m.props.code || m.props.region || m.props.name); } catch { } }}
            onPointerOut={(e) => { e.stopPropagation(); try { setHoveredRegion(null); } catch { } }}
            onClick={(e) => { e.stopPropagation(); try { setRegionFilter(m.props.code || m.props.region || m.props.name, true); } catch { } }}
            geometry={m.geometry} position={[0, 0, 0]} rotation={[0, 0, 0]}
          >
            <meshStandardMaterial color={hoveredRegion === (m.props.code || m.props.region || m.props.name) ? '#ffffee' : m.color} transparent opacity={hoveredRegion === (m.props.code || m.props.region || m.props.name) ? 0.42 : 0.22} side={THREE.DoubleSide} />
          </mesh>
          {/* centroid label */}
          <group position={convertLatLonToVec3(m.props.centroid ? m.props.centroid[1] : 0, m.props.centroid ? m.props.centroid[0] : 0, R+0.04)}>
            <Html distanceFactor={6} center>
              <div className="bg-black/80 text-white text-xs rounded px-2 py-1">
                <div className="font-semibold">{m.props.provider} {m.props.code || m.props.region || m.props.name}</div>
                  <div className="text-xs">Servers: {m.props.serverCount ?? (Array.isArray((m.props as any).members) ? (m.props as any).members.length : (m.props.serverCount ?? 0))}</div>
              </div>
            </Html>
          </group>
        </group>
        );
      })}
    </group>
  );
};

export default RegionBoundaries;
