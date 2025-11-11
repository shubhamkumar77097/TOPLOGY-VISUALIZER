async function run() {
  try {
    console.log('Posting sample record...');
    await fetch('http://localhost:3000/api/history', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ from: 'loc1', to: 'loc2', value: Math.floor(Math.random()*200), ts: Date.now() }) });
    console.log('Requesting export...');
    const ex = await fetch('http://localhost:3000/api/history/export');
    console.log('Export status', ex.status);
    console.log('Validating history...');
    const v = await fetch('http://localhost:3000/api/history/validate');
    const j = await v.json();
    console.log('Validate result:', j);
  } catch (e) {
    console.error('Smoke test failed', e);
    process.exitCode = 2;
  }
}
run();
