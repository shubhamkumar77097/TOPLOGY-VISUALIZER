import { create } from "zustand";

export type LatencyRecord = {
  from: string;
  to: string;
  value: number;
  ts: number;
};

type State = {
  latencies: Record<string, LatencyRecord>;
  history: Record<string, LatencyRecord[]>;
  selectedLocation: string | null;
  selectedPair: string | null;
  hoveredRegion: string | null;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  providerFilters: Record<string, boolean>;
  regionFilters: Record<string, boolean>;
  pulsesEnabled: boolean;
  externalSourceEnabled: boolean;
  arcSpeed: number;
  maxLatency: number;
  minLatency: number;
  persistControls: boolean;
  searchQuery: string;
  theme: 'dark' | 'light';
  mobileMode: boolean;
  lowPerfMode: boolean;
  smoothingFactor?: number;
  setLatency: (key: string, rec: LatencyRecord) => void;
  setSelectedLocation: (id: string | null) => void;
  setSelectedPair: (pair: string | null) => void;
  setWsStatus: (st: 'connecting' | 'connected' | 'disconnected') => void;
  setProviderFilter: (provider: string, enabled: boolean) => void;
  setRegionFilter: (region: string, enabled: boolean) => void;
  setPulsesEnabled: (enabled: boolean) => void;
  setExternalSourceEnabled: (v: boolean) => void;
  setArcSpeed: (speed: number) => void;
  setMaxLatency: (m: number) => void;
  setMinLatency: (m: number) => void;
  setPersistControls: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setTheme: (t: 'dark'|'light') => void;
  setMobileMode: (m: boolean) => void;
  setLowPerfMode: (m: boolean) => void;
  setHoveredRegion: (r: string | null) => void;
  setSmoothingFactor?: (v: number) => void;
};

export const useLatencyStore = create<State>((set) => ({
  latencies: {},
  history: {},
  selectedLocation: null,
  selectedPair: null,
  wsStatus: 'disconnected',
  providerFilters: { AWS: true, GCP: true, Azure: true, Other: true },
  regionFilters: {},
  pulsesEnabled: true,
  arcSpeed: 1,
  maxLatency: 1000,
  minLatency: 0,
  persistControls: true,
  showHeatmap: true,
  showLegend: true,
  showRegions: true,
  cameraTarget: null as any,
  searchQuery: '',
  theme: 'dark',
  mobileMode: false,
  lowPerfMode: false,
  wsPolling: false,
  serverProbesEnabled: false,
  allowClientProbes: false,
  externalSourceEnabled: false,
  smoothingFactor: 0.35,
  hoveredRegion: null,
  setLatency: (key: string, rec: LatencyRecord) =>
    set((state: State) => {
      const prev = state.history[key] ?? [];
      const history = [...prev, rec].slice(-500);
      return {
        latencies: { ...state.latencies, [key]: rec },
        history: { ...state.history, [key]: history },
      } as Partial<State> as State;
    }),
  setSelectedLocation: (id: string | null) => set({ selectedLocation: id }),
  setSelectedPair: (pair: string | null) => set({ selectedPair: pair }),
  setWsStatus: (st: 'connecting' | 'connected' | 'disconnected') => set({ wsStatus: st }),
  setProviderFilter: (provider: string, enabled: boolean) =>
    set((state) => ({ providerFilters: { ...state.providerFilters, [provider]: enabled } } as Partial<State> as State)),
  setRegionFilter: (region: string, enabled: boolean) =>
    set((state) => ({ regionFilters: { ...state.regionFilters, [region]: enabled } } as Partial<State> as State)),
  setPulsesEnabled: (enabled: boolean) => set({ pulsesEnabled: enabled } as Partial<State> as State),
  setShowHeatmap: (v: boolean) => set({ showHeatmap: v } as Partial<State> as State),
  setShowLegend: (v: boolean) => set({ showLegend: v } as Partial<State> as State),
  setShowRegions: (v: boolean) => set({ showRegions: v } as Partial<State> as State),
  setCameraTarget: (t: any) => set({ cameraTarget: t } as Partial<State> as State),
  setArcSpeed: (speed: number) => set({ arcSpeed: speed } as Partial<State> as State),
  setMaxLatency: (m: number) => set({ maxLatency: m } as Partial<State> as State),
  setMinLatency: (m: number) => set({ minLatency: m } as Partial<State> as State),
  setPersistControls: (v: boolean) => set({ persistControls: v } as Partial<State> as State),
  setSearchQuery: (q: string) => set({ searchQuery: q } as Partial<State> as State),
  setTheme: (t: 'dark'|'light') => set({ theme: t } as Partial<State> as State),
  setMobileMode: (m: boolean) => set({ mobileMode: m } as Partial<State> as State),
  setLowPerfMode: (m: boolean) => set({ lowPerfMode: m } as Partial<State> as State),
  setHoveredRegion: (r: string | null) => set({ hoveredRegion: r } as Partial<State> as State),
  setSmoothingFactor: (v: number) => set({ smoothingFactor: v } as Partial<State> as State),
  setWsPolling: (v: boolean) => set({ wsPolling: v } as Partial<State> as State),
  setServerProbesEnabled: (v: boolean) => set({ serverProbesEnabled: v } as Partial<State> as State),
  setAllowClientProbes: (v: boolean) => set({ allowClientProbes: v } as Partial<State> as State),
  setExternalSourceEnabled: (v: boolean) => set({ externalSourceEnabled: v } as Partial<State> as State),
}));
