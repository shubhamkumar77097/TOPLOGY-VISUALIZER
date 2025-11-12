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
  exchangeFilters: Record<string, boolean>;
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
  smoothingFactor: number;
  showHeatmap: boolean;
  showLegend: boolean;
  showRegions: boolean;
  showEmptyRegions: boolean;
  cameraTarget: any;
  wsPolling: boolean;
  serverProbesEnabled: boolean;
  allowClientProbes: boolean;
  showArcs: boolean;
  showTopology: boolean;
  visibleRegions: Set<string>;

  setLatency: (key: string, rec: LatencyRecord) => void;
  setSelectedLocation: (id: string | null) => void;
  setSelectedPair: (pair: string | null) => void;
  setWsStatus: (st: 'connecting' | 'connected' | 'disconnected') => void;
  setProviderFilter: (provider: string, enabled: boolean) => void;
  setRegionFilter: (region: string, enabled: boolean) => void;
  setExchangeFilter: (exchange: string, enabled: boolean) => void;
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
  setSmoothingFactor: (v: number) => void;
  setShowHeatmap: (v: boolean) => void;
  setShowLegend: (v: boolean) => void;
  setShowRegions: (v: boolean) => void;
  setShowEmptyRegions: (v: boolean) => void;
  setCameraTarget: (t: any) => void;
  setWsPolling: (v: boolean) => void;
  setServerProbesEnabled: (v: boolean) => void;
  setAllowClientProbes: (v: boolean) => void;
  setShowArcs: (v: boolean) => void;
  setShowTopology: (v: boolean) => void;
  toggleRegionVisibility: (code: string) => void;
};

export const useLatencyStore = create<State>((set) => ({
  latencies: {},
  history: {},
  selectedLocation: null,
  selectedPair: null,
  wsStatus: 'disconnected',
  providerFilters: { AWS: true, GCP: true, Azure: true, Other: true },
  regionFilters: {},
  exchangeFilters: {},
  pulsesEnabled: true,
  arcSpeed: 1,
  maxLatency: 1000,
  minLatency: 0,
  persistControls: true,
  showHeatmap: true,
  showLegend: true,
  showRegions: true,
  showEmptyRegions: false,
  cameraTarget: null,
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
  showArcs: true,
  showTopology: true,
  visibleRegions: new Set<string>(),
  setLatency: (key: string, rec: LatencyRecord) =>
    set((state) => {
      const prev = state.history[key] ?? [];
      const history = [...prev, rec].slice(-500);
      return {
        latencies: { ...state.latencies, [key]: rec },
        history: { ...state.history, [key]: history },
      };
    }),
  setSelectedLocation: (id: string | null) => set({ selectedLocation: id }),
  setSelectedPair: (pair: string | null) => set({ selectedPair: pair }),
  setWsStatus: (st: 'connecting' | 'connected' | 'disconnected') => set({ wsStatus: st }),
  setProviderFilter: (provider: string, enabled: boolean) =>
    set((state) => {
      if (state.providerFilters[provider] === enabled) return {};
      return { providerFilters: { ...state.providerFilters, [provider]: enabled } };
    }),
  setRegionFilter: (region: string, enabled: boolean) =>
    set((state) => {
      if (state.regionFilters[region] === enabled) return {};
      return { regionFilters: { ...state.regionFilters, [region]: enabled } };
    }),
  setExchangeFilter: (exchange: string, enabled: boolean) =>
    set((state) => {
      if (state.exchangeFilters[exchange] === enabled) return {};
      return { exchangeFilters: { ...state.exchangeFilters, [exchange]: enabled } };
    }),
  setPulsesEnabled: (enabled: boolean) => set((state) => (state.pulsesEnabled === enabled ? {} : { pulsesEnabled: enabled })),
  setShowHeatmap: (v: boolean) => set((state) => (state.showHeatmap === v ? {} : { showHeatmap: v })),
  setShowLegend: (v: boolean) => set((state) => (state.showLegend === v ? {} : { showLegend: v })),
  setShowRegions: (v: boolean) => set((state) => (state.showRegions === v ? {} : { showRegions: v })),
  setShowEmptyRegions: (v: boolean) => set((state) => (state.showEmptyRegions === v ? {} : { showEmptyRegions: v })),
  setCameraTarget: (t: any) => set({ cameraTarget: t }),
  setArcSpeed: (speed: number) => set({ arcSpeed: speed }),
  setMaxLatency: (m: number) => set({ maxLatency: m }),
  setMinLatency: (m: number) => set({ minLatency: m }),
  setPersistControls: (v: boolean) => set({ persistControls: v }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setTheme: (t: 'dark'|'light') => set({ theme: t }),
  setMobileMode: (m: boolean) => set({ mobileMode: m }),
  setLowPerfMode: (m: boolean) => set((state) => (state.lowPerfMode === m ? {} : { lowPerfMode: m })),
  setHoveredRegion: (r: string | null) => set({ hoveredRegion: r }),
  setSmoothingFactor: (v: number) => set({ smoothingFactor: v }),
  setWsPolling: (v: boolean) => set((state) => (state.wsPolling === v ? {} : { wsPolling: v })),
  setServerProbesEnabled: (v: boolean) => set((state) => (state.serverProbesEnabled === v ? {} : { serverProbesEnabled: v })),
  setAllowClientProbes: (v: boolean) => set((state) => (state.allowClientProbes === v ? {} : { allowClientProbes: v })),
  setExternalSourceEnabled: (v: boolean) => set((state) => (state.externalSourceEnabled === v ? {} : { externalSourceEnabled: v })),
  setShowArcs: (v: boolean) => set((state) => (state.showArcs === v ? {} : { showArcs: v })),
  setShowTopology: (v: boolean) => set((state) => (state.showTopology === v ? {} : { showTopology: v })),
  toggleRegionVisibility: (code: string) => set((state) => {
    const newSet = new Set(state.visibleRegions);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    return { visibleRegions: newSet };
  }),
}));
