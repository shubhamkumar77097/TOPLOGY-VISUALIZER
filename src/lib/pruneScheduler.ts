import { pruneHistory } from '@/lib/historyStore';

let started = false;

const MINUTES = Number(process.env.PRUNE_INTERVAL_MINUTES || '60');
const INTERVAL = Math.max(1, MINUTES) * 60 * 1000;

async function doPrune() {
  try {
    const res = await pruneHistory();
     
    console.log('[pruneScheduler] prune result', res);
  } catch (e) {
     
    console.error('[pruneScheduler] prune failed', e);
  }
}

export function startPruneScheduler() {
  if (started) return;
  started = true;
  // run once on start if requested
  if (process.env.PRUNE_ON_START === '1' || process.env.PRUNE_ON_START === 'true') {
    doPrune();
  }
  setInterval(() => doPrune(), INTERVAL);
   
  console.log(`[pruneScheduler] started with interval ${INTERVAL}ms`);
}

// auto-start when this module is imported in a server runtime
try { startPruneScheduler(); } catch { /* ignore */ }
