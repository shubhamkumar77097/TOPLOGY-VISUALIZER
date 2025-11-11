#!/usr/bin/env node
(async ()=>{
  try{
    const path = require('path');
    const fetch = eval('require')('node-fetch');
    const now = () => Date.now();
    const timeoutFetch = async (url, opts={}, tms=5000) => {
      return Promise.race([fetch(url, opts), new Promise((_, rej) => setTimeout(()=>rej(new Error('timeout')), tms))]);
    };

    // attempt to load locations
    let locs = null;
    try { locs = require(path.resolve(process.cwd(), 'src/data/locations.ts')); }
    catch { try { locs = require(path.resolve(process.cwd(), 'data/exchanges.json')); } catch { locs = null; } }
    if (!locs) { console.error('No locations to probe'); process.exit(1); }
    locs = locs && locs.locations ? locs.locations : (Array.isArray(locs)?locs:Object.values(locs));

    const sample = locs.slice(0, 6);

  // import appendRecord directly
  let hs = null;
  try { hs = require(path.resolve(process.cwd(), 'src/lib/historyStore.ts')); } catch { /* historyStore import failed */ }
    const appendRecord = hs && hs.appendRecord ? hs.appendRecord : null;

    for (let i=0;i<sample.length;i++){
      for (let j=i+1;j<sample.length;j++){
        const a = sample[i]; const b = sample[j];
        const urlA = a.url || 'https://www.google.com/generate_204';
        const urlB = b.url || 'https://www.google.com/generate_204';
        // A -> B
        try{
          const t0 = now();
          await timeoutFetch(urlB, { method: 'GET' }, 5000);
          const t1 = now();
          const rec = { from: a.id||a, to: b.id||b, value: t1-t0, ts: t1 };
          // retry append up to 2 times
          for (let attempt=0; attempt<2; attempt++) {
            try { if (appendRecord) await appendRecord(`${a.id}->${b.id}`, rec); break; } catch { if (attempt===1) console.error('appendRecord failed'); }
          }
          try{ await timeoutFetch('http://localhost:8082/broadcast',{ method: 'POST', body: JSON.stringify(rec), headers: {'Content-Type':'application/json'} }, 2000); }catch{}
        }catch(e){ /* swallow */ }
        // B -> A
        try{
          const t2 = now();
          await timeoutFetch(urlA, { method: 'GET' }, 5000);
          const t3 = now();
          const rec2 = { from: b.id||b, to: a.id||a, value: t3-t2, ts: t3 };
          for (let attempt=0; attempt<2; attempt++) { try { if (appendRecord) await appendRecord(`${b.id}->${a.id}`, rec2); break; } catch { if (attempt===1) console.error('appendRecord failed'); } }
          try{ await timeoutFetch('http://localhost:8082/broadcast',{ method: 'POST', body: JSON.stringify(rec2), headers: {'Content-Type':'application/json'} }, 2000); }catch{}
        }catch(e){ /* swallow */ }
        await new Promise(r=>setTimeout(r, 200));
      }
    }
    console.log('Worker direct probes complete');
  }catch(e){ console.error('worker error', e); process.exit(1); }
})();
