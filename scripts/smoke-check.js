const fetch = require('node-fetch');
const WebSocket = require('ws');

async function httpCheck(url) {
  try {
    const r = await fetch(url, { timeout: 5000 });
    return { ok: true, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function wsCheck(url) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, { handshakeTimeout: 5000 });
    let done = false;
    ws.on('open', () => { if (done) return; done = true; ws.close(); resolve({ ok: true }); });
    ws.on('error', (err) => { if (done) return; done = true; resolve({ ok: false, error: String(err) }); });
    setTimeout(() => { if (done) return; done = true; try { ws.terminate(); } catch{}; resolve({ ok: false, error: 'timeout' }); }, 6000);
  });
}

(async ()=>{
  console.log('Running smoke checks...');
  const checks = [
    { name: 'Next HTTP', fn: () => httpCheck('http://localhost:3000/') },
    { name: 'API /api/regions', fn: () => httpCheck('http://localhost:3000/api/regions') },
    { name: 'API /api/history/aggregate', fn: () => httpCheck('http://localhost:3000/api/history/aggregate?range=24h') },
    { name: 'Mock WS', fn: () => wsCheck('ws://localhost:8081') },
  ];
  for (const c of checks) {
    process.stdout.write(`${c.name}... `);
    const r = await c.fn();
    if (r.ok) console.log('OK', r.status ? `status=${r.status}` : ''); else console.log('FAIL', r.error || '');
  }
  console.log('Smoke checks complete.');
})();
