"use client";

import { useMemo } from 'react';
import { useLatencyStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { locations } from '@/data/locations';
import { convertLatLonToVec3 } from '@/lib/utils';

const LOW_PERF_MAX_LINKS = 20;
const MAX_LINKS = 60;

async function fetchVolumeData() {
  const res = await fetch('/api/volume');
  if (!res.ok) {
    throw new Error('Failed to fetch volume data');
  }
  return res.json();
}

interface Link {
  key: string;
  curve: THREE.QuadraticBezierCurve3;
  value: number;
}

export default function DataFlowWrapper() {
  return <DataFlow />;
}

// Simple particle along an arc for each active link; not physically accurate but visually representative
function DataFlow() {
  const pulsesEnabled = useLatencyStore((s) => s.pulsesEnabled);
  const lowPerf = useLatencyStore((s) => (s as any).lowPerfMode);

  const { data: volumeData, error } = useQuery({
    queryKey: ['volumeData'],
    queryFn: fetchVolumeData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const links: Link[] = useMemo(() => {
    if (!volumeData) return [];

    // Create a stable-ish mapping from trading pair to a random-looking-but-consistent link
    return volumeData.slice(0, lowPerf ? LOW_PERF_MAX_LINKS : MAX_LINKS).map((item: any, index: number) => {
      // Use a simple hashing scheme on the pair name to pick two locations
      const hashString = `${item.base}/${item.target}`;
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        hash = (hash << 5) - hash + hashString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      const fromIndex = Math.abs(hash) % locations.length;
      // Offset by a prime number to get a different second location
      const toIndex = (fromIndex + 71) % locations.length;
      
      const from = locations[fromIndex];
      const to = locations[toIndex];

      if (!from || !to || from.id === to.id) return null;

      const p1 = convertLatLonToVec3(from.lat, from.lng, 3.02);
      const p2 = convertLatLonToVec3(to.lat, to.lng, 3.02);
      // Use a deterministic value from the hash for the arc height to avoid impurity
      const arcHeight = 3.03 + (Math.abs(hash) % 100) / 2000;
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(arcHeight);
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      
      return {
        key: `${from.id}-${to.id}-${index}`,
        curve,
        // Normalize volume for visual effect
        value: Math.log(item.volume + 1),
      };
    }).filter((link: Link | null): link is Link => Boolean(link));
  }, [volumeData, lowPerf]);

  useFrame(({ clock }) => {
    if (typeof document === 'undefined') return;

    links.forEach((l: Link, idx: number) => {
      // short-circuit on perf mode
      if (!pulsesEnabled) {
        // Cleanup DOM elements if pulses are disabled
        const id = `df-${l.key}`;
        const el = document.getElementById(id);
        if (el) el.remove();
        return;
      }
      
      // determine a phase and position on curve
      const speed = 0.1 + Math.min(1.5, (l.value || 1) / 10); // Adjusted for log-scaled volume
      const phase = (clock.getElapsedTime() * speed + (idx % 13) / 13) % 1;
      const pos = l.curve.getPointAt(phase);
      
      // place a small sprite or point at pos
      const id = `df-${l.key}`;
      let el = document.getElementById(id) as HTMLDivElement | null;
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'absolute';
        el.style.width = '6px';
        el.style.height = '6px';
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.background = 'rgba(96, 165, 250, 0.9)';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.zIndex = '9999';
        // Add to a container to avoid polluting body and for easier cleanup
        const container = document.getElementById('data-flow-container') || document.body;
        container.appendChild(el);
      }
      
      // project into screen
      try {
        const vector = pos.clone();
        const camera = (window as any).__r3f_camera__;
        if (!camera) return;
        vector.project(camera);
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = (-vector.y + 1) / 2 * window.innerHeight;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        // Opacity based on volume
        el.style.opacity = String(Math.max(0.2, Math.min(1, l.value / 20)));
      } catch {
        // This can happen if the camera isn't ready, just ignore
      }
    });
  });

  // Cleanup DOM elements on unmount
  // useMemo will only run this once
  useMemo(() => {
    return () => {
      if (typeof document !== 'undefined') {
        links.forEach((l: Link) => {
          const el = document.getElementById(`df-${l.key}`);
          if (el) el.remove();
        });
      }
    };
  }, [links]);

  if (error) {
    console.error("Failed to load volume data:", error);
  }

  return null;
}
