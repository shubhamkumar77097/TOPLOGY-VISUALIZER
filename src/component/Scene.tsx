// src/components/Scene.tsx
"use client"; // This is a client component

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Earth } from "./Earth"; // Import our new Earth component
import { Locations } from "./Locations";
import { Legend } from "./Legend";
import { useLatencyStore } from '@/lib/store';
import { SelectionBadge, StatusBadge } from './Badges';
import { PairLabel } from './PairLabel';
import { RealtimeProvider } from "./RealtimeProvider";
import { LatencyArcs } from "./LatencyArcs";
import { InfoPanel } from "./InfoPanel";
import { ControlsPanel } from "./ControlsPanel";
import { Regions } from "./Regions";
import Heatmap from './Heatmap';
import Topology from './Topology';
import PerformanceMetrics from './PerformanceMetrics';
import DataFlow from './DataFlow';
import * as THREE from 'three';
import SystemStatus from './SystemStatus';
import RegionBoundaries from './RegionBoundaries';
import HistoryPanel from './HistoryPanel';

/**
 * The main 3D scene component.
 * This sets up the Canvas, lighting, controls, and our 3D objects.
 */
export default function Scene() {
  // Setup a client-only resize watcher to set mobile mode in the store
  useEffect(() => {
    const onResize = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      try {
        // dynamic import to avoid forbidden require and SSR issues
        import('@/lib/store').then((m) => { m.useLatencyStore.getState().setMobileMode(Boolean(isMobile)); }).catch(()=>{});
      } catch {
        /* ignore during SSR or if store import fails */
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // auto-enable lowPerfMode for very small screens or low memory devices
  useEffect(() => {
    try {
      const s = (useLatencyStore as any).getState();
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
      if (isMobile) s.setLowPerfMode(true);
    } catch {}
  }, []);
  const showHeatmap = useLatencyStore((s) => (s as any).showHeatmap);
  const showLegend = useLatencyStore((s) => (s as any).showLegend);
  const lowPerfMode = useLatencyStore((s) => (s as any).lowPerfMode);
  const mobileMode = useLatencyStore((s) => (s as any).mobileMode);
  // CameraAnimator uses three-fiber hooks and must be rendered inside the Canvas.
  function CameraAnimator() {
    const ct = useLatencyStore((s) => (s as any).cameraTarget);
    const { camera } = useThree();
    const animRef = useRef<{ start: number; from: THREE.Vector3; to: THREE.Vector3 } | null>(null);
    useEffect(() => {
      (async () => {
        if (!ct) return;
        const from = camera.position.clone();
        const to = new THREE.Vector3(...(ct.pos || [0, 0, 6]));
        animRef.current = { start: performance.now(), from, to };
      })();
    }, [ct, camera]);
    useFrame(() => {
      if (!animRef.current) return;
      const now = performance.now();
      const elapsed = now - animRef.current.start;
      const t = Math.min(1, elapsed / 800);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      camera.position.lerpVectors(animRef.current.from, animRef.current.to, eased);
      // if target includes focus coords, look at that point, otherwise look at origin
        try {
  const ct2 = (useLatencyStore as any).getState().cameraTarget as any;
        if (ct2 && ct2.focus && typeof ct2.focus.lat === 'number' && typeof ct2.focus.lng === 'number') {
          // resolve focus asynchronously and look at it when ready
          import('@/lib/utils').then((m) => { try { const v = m.convertLatLonToVec3(ct2.focus.lat, ct2.focus.lng, 3.01); camera.lookAt(v.x, v.y, v.z); } catch { camera.lookAt(0,0,0); } }).catch(()=>{ camera.lookAt(0,0,0); });
        } else camera.lookAt(0, 0, 0);
      } catch { camera.lookAt(0, 0, 0); }
      if (t >= 1) animRef.current = null;
    });
    return null;
  }

  // RenderManager enables "demand" frameloop for low perf/mobile modes
  // It invalidates the canvas periodically to reflect updated latency data
  // and temporarily switches to continuous rendering while the user interacts.
  function RenderManager() {
    const { gl, invalidate } = useThree();
    const last = useRef<number>(performance.now());
    const ptrRef = useRef<number | null>(null);
    // poll interval depends on perf mode
    const interval = lowPerfMode ? 1500 : mobileMode ? 800 : 300;

    useEffect(() => {
      let mounted = true;
      function tick() {
        if (!mounted) return;
        const now = performance.now();
        if (now - last.current >= interval) {
          last.current = now;
          try { invalidate(); } catch {}
        }
        ptrRef.current = window.setTimeout(tick, interval);
      }
      ptrRef.current = window.setTimeout(tick, interval);
      return () => {
        mounted = false;
        if (ptrRef.current) window.clearTimeout(ptrRef.current);
      };
    }, [interval, invalidate]);

    useEffect(() => {
      // ensure the canvas uses a sane pixel ratio; lowPerf/mobile toggles are read directly when needed
    try { 
      // cap pixel ratio to avoid large buffers on high-DPR mobile devices
      const base = Math.min(2, window.devicePixelRatio || 1);
      const cap = (lowPerfMode || mobileMode) ? 1 : base;
      gl.setPixelRatio(cap);
    } catch {}
    }, [gl]);

    // while the user is interacting, temporarily force continuous updates
    useEffect(() => {
      let active = false;
      const onPointerDown = () => {
        if (active) return;
        active = true;
        try {
          // request animation loop by invalidating frequently for 1s
          const start = performance.now();
          const frame = () => {
            invalidate();
            if (performance.now() - start < 1000) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        } catch {}
      };
      const canvas = gl.domElement as HTMLCanvasElement | null;
      if (canvas) {
        canvas.addEventListener('pointerdown', onPointerDown);
      }
      return () => {
        if (canvas) canvas.removeEventListener('pointerdown', onPointerDown);
      };
    }, [gl, invalidate]);

    return null;
  }

  // Render manager inside Canvas will handle demand-mode invalidation
  return (
    // Make this container relative so Legend (absolute) positions correctly
    <div className="relative h-full w-full">
      {/* Set the camera's initial position.
        'fov' is "field of view".
        'position' is [x, y, z]. We're setting it 10 units back on the Z-axis.
      */}
  <RealtimeProvider>
  <Canvas
          camera={{ fov: 75, position: [0, 0, 10] }}
          frameloop={lowPerfMode || mobileMode ? 'demand' : 'always'}
          // prefer a conservative DPR on mobile/low perf; let RenderManager also cap gl pixel ratio
          dpr={(lowPerfMode || mobileMode) ? 1 : (typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1)}
          gl={{ antialias: !lowPerfMode, powerPreference: lowPerfMode ? 'low-power' : 'default' }}
        >
        <RenderManager />
        {/* We'll use a softer ambient light so we can see the whole globe,
          and a point light to simulate the sun.
        */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={3} />

  {/* This is our new Earth component */}
  <Earth />

  <RegionBoundaries />

  {/* Render location markers */}
  <Locations />
  <LatencyArcs />
  <Regions />
  {/* Topology overlay requires useThree, render inside Canvas */}
  <Topology />
  {/* Performance metrics (FPS) inside Canvas */}
  <PerformanceMetrics />
  {/* Animated data-flow visualization */}
  <DataFlow />
  {/* PairLabel uses <Html /> and must be inside Canvas */}
  <PairLabel />
  {/* Camera animator must be inside Canvas */}
  <CameraAnimator />
        
        {/*
          OrbitControls allow the user to rotate, zoom, and pan.
          We've added min/max distance to prevent zooming too far in or out.
        */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableDamping={true}
          // compute control params once per render to avoid repeated store reads inside JSX
          dampingFactor={mobileMode ? 0.16 : 0.08}
          rotateSpeed={mobileMode ? 0.45 : 0.6}
          panSpeed={mobileMode ? 0.7 : 0.9}
          minDistance={mobileMode ? 4 : 5}
          maxDistance={mobileMode ? 12 : 20}
        />
      </Canvas>
      {/* InfoPanel overlay (show selected location/pair stats) */}
      <InfoPanel />
  </RealtimeProvider>
        {/* Legend rendered as an overlay in the DOM */}
        {showLegend && <Legend />}

      {/* Heatmap overlay (togglable via store) */}
      {showHeatmap && <Heatmap />}

      <ControlsPanel />
      <SystemStatus />
      <HistoryPanel />

      <SelectionBadge />
      <StatusBadge />
      {/* Inline fallback visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 left-4 z-50 rounded bg-pink-500 text-white px-3 py-2">
          LEGEND FALLBACK
        </div>
      )}
    </div>
  );
}

// set mobile mode on client - small wrapper you can import where needed
export function SceneWrapper() {
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
    // lazy import store to avoid SSR issues
    import('@/lib/store')
      .then(({ useLatencyStore }) => {
        const setMobile = useLatencyStore.getState().setMobileMode;
        setMobile(Boolean(isMobile));
      })
      .catch(() => {});
  }, []);
  return <Scene />;
}
