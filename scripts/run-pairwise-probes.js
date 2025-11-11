#!/usr/bin/env node
/*
Simple server-side pairwise probe runner (demo).
Usage: node scripts/run-pairwise-probes.js
It reads a small set of endpoints from src/data/locations.ts (by id mapping to a probe URL template).
It performs a simple HTTP GET to each URL and records RTT, then writes to /api/history via direct store append when possible.
*/

(async () => {
  try {
    const path = require('path');
  // const { execSync } = require('child_process'); // not used
    const locations = require(path.resolve(process.cwd(), 'src/data/locations.ts'));
    // locations is TS; if not resolvable, fallback to data/exchanges.json
    let locs = locations && locations.locations ? locations.locations : null;
    if (!locs) {
      try {
        locs = require(path.resolve(process.cwd(), 'data', 'exchanges.json'));
      } catch {
        console.error('No locations found to probe');
        process.exit(1);
      }
    }

    // simple probe function using node-fetch if available
    const fetch = eval('require')('node-fetch');
    const now = () => Date.now();

    // minimal list: pick first 4 locations to avoid long runs
    const sample = (Array.isArray(locs) ? locs : Object.values(locs)).slice(0, 4);

    const appendRecord = async (pair, rec) => {
      // try to call local API (assumes server running), otherwise try direct appendRecord import
      try {
        const res = await fetch('http://localhost:3000/api/history', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(rec) });
        if (!res.ok) console.warn('POST /api/history failed', await res.text());
      } catch {
          try {
            const hs = require(path.resolve(process.cwd(), 'src/lib/historyStore.ts'));
            await hs.appendRecord(pair, rec);
          } catch {
            console.error('Failed to persist record');
          }
        }
    };

    // run pairwise probes among sample entries
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const a = sample[i];
        const b = sample[j];
        // pick target URLs conservatively
        const urlA = a.url || 'https://www.google.com/generate_204';
        const urlB = b.url || 'https://www.google.com/generate_204';

        // probe A -> B
        const t0 = now();
        try {
          await fetch(urlB, { method: 'GET', timeout: 5000 });
          const t1 = now();
          const rtt = t1 - t0;
          const rec = { from: a.id || a, to: b.id || b, value: rtt, ts: t1 };
          console.log('Probe', a.id, '->', b.id, rtt);
          await appendRecord(`${a.id}->${b.id}`, rec);
        } catch (e) {
          console.warn('Probe failed', a.id, '->', b.id, String(e));
        }

        // probe B -> A
        const t2 = now();
        try {
          await fetch(urlA, { method: 'GET', timeout: 5000 });
          const t3 = now();
          const rtt2 = t3 - t2;
          const rec2 = { from: b.id || b, to: a.id || a, value: rtt2, ts: t3 };
          console.log('Probe', b.id, '->', a.id, rtt2);
          await appendRecord(`${b.id}->${a.id}`, rec2);
        } catch (e) {
          console.warn('Probe failed', b.id, '->', a.id, String(e));
        }

        // small delay between pairs
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    console.log('Pairwise probes complete');
  } catch (e) {
    console.error('Runner error', e);
    process.exit(1);
  }
})();
