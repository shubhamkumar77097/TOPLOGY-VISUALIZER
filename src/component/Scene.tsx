// src/components/Scene.tsx
"use client"; // This is a client component

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import PerformanceMetrics, { PerformanceOverlay } from './PerformanceMetrics';
import DataFlowWrapper from './DataFlow';
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
  const queryClient = new QueryClient();

  return (
    // Make this container relative so Legend (absolute) positions correctly
    <div className="relative h-full w-full">
      <RealtimeProvider>
        <QueryClientProvider client={queryClient}>
        <Canvas
          frameloop={lowPerfMode || mobileMode ? 'demand' : 'always'}
          camera={{ position: [0, 0, 6], fov: 50 }}
          onCreated={({ camera }) => {
            // store camera ref for DOM overlay projections
            (window as any).__r3f_camera__ = camera;
          }}
        >
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <Earth />
          <Locations />
          <LatencyArcs />
          <Regions />
          <RegionBoundaries />
          <DataFlowWrapper />
          <CameraAnimator />
          <RenderManager />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3.5}
            maxDistance={10}
            zoomSpeed={0.6}
            rotateSpeed={0.4}
          />
          <Topology />
          <PerformanceMetrics />
        </Canvas>
        </QueryClientProvider>
  <div id="data-flow-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  {showHeatmap && <Heatmap />}
        <PerformanceOverlay />
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-start">
              {/* Top-left UI elements */}
              <div className="flex flex-col space-y-2 items-start">
                <SelectionBadge />
                <StatusBadge />
              </div>
              {/* Top-right UI elements */}
              <div className="flex flex-col space-y-2 items-end">
                <SystemStatus />
              </div>
            </div>
            <div className="flex-grow" /> {/* Spacer */}
            <div className="p-4 flex justify-between items-end">
              {/* Bottom-left UI elements */}
              <div className="flex flex-col space-y-2 items-start">
                {showLegend && <Legend />}
              </div>
              {/* Bottom-right UI elements */}
              <div className="flex flex-col space-y-2 items-end">
                <HistoryPanel />
                <InfoPanel />
              </div>
            </div>
          </div>
        </div>
        {/* ControlsPanel fixed to top-right, outside flow */}
        <ControlsPanel />
        <PairLabel />
        {/* <Topology />
        <PerformanceMetrics /> */}
      </RealtimeProvider>
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
