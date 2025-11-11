// scripts/smoke-external-latency.js
// Simple smoke test to call the local proxy route for external latency API.
(async function(){
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const url = base + '/api/external-latency';
  try {
    const r = await fetch(url);
    const j = await r.json();
    console.log('status', r.status, 'body', JSON.stringify(j, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('fetch error', err);
    process.exit(2);
  }
})();
