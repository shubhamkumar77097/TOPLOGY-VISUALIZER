#!/usr/bin/env node
// Simple scheduler that calls the probes/run API at configured interval (demo only)
(async ()=>{
  try{
    const fetch = eval('require')('node-fetch');
    const interval = Number(process.env.PROBE_INTERVAL_MS || 60000); // default 60s
    console.log('Starting probe scheduler, interval', interval);
    while(true) {
      try {
        const res = await fetch('http://localhost:3000/api/probes/run', { method: 'POST' });
        console.log('Probe run status', res.status);
      } catch (e) {
        console.error('Probe run error', e);
      }
      await new Promise(r=>setTimeout(r, interval));
    }
  }catch(e){ console.error('Scheduler error', e); process.exit(1); }
})();
