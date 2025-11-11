// Visual tuning constants for latency visualization
export const LATENCY_THRESHOLDS = {
  green: 120, // <= ms
  yellow: 300, // between green and yellow
  red: 99999, // anything above
};

export const LATENCY_COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

export const PULSE_CONFIG = {
  // base speed multiplier for pulses; larger value -> faster movement
  baseSpeed: 0.12,
  // speed scaling divisor for latency influence (higher -> slower effect)
  latencyDivisor: 300,
  // pulse size bounds
  minSize: 0.015,
  maxSize: 0.06,
};

export const DEFAULT_UPDATE_MS = 7000; // default external poll interval (7s)

export const MAX_ARCS = 80;

const VISUAL_CONFIG = {
  LATENCY_THRESHOLDS,
  LATENCY_COLORS,
  PULSE_CONFIG,
  DEFAULT_UPDATE_MS,
};

export default VISUAL_CONFIG;
