// Prune worker: calls the local /api/history/prune endpoint.
// Usage: RUN_ONCE=1 node scripts/prune-worker.js
const http = require('http');
(async function(){
  const runOnce = process.env.RUN_ONCE === '1' || process.env.RUN_ONCE === 'true';
  const port = process.env.PORT || 3000;
  const prune = () => new Promise((res, rej) => {
    const opts = { method: 'POST', hostname: 'localhost', port, path: '/api/history/prune' };
    const req = http.request(opts, (r) => {
      let b = '';
      r.on('data', (c) => b += c.toString());
      r.on('end', () => res({ statusCode: r.statusCode, body: b }));
    });
    req.on('error', rej);
    req.end();
  });

  if (runOnce) {
    try {
      console.log('Prune worker: calling /api/history/prune');
      const r = await prune();
      console.log('Prune result:', r.statusCode, r.body);
      process.exit(0);
    } catch (e) {
      console.error('Prune failed:', e);
      process.exit(2);
    }
  }

  // Otherwise, run periodic pruning every hour
  console.log('Prune worker: starting periodic prune every 1h');
  setInterval(async () => {
    try {
      const r = await prune();
      console.log('Prune tick:', r.statusCode);
    } catch (e) {
      console.error('Prune tick failed:', e);
    }
  }, 1000 * 60 * 60);
})();
