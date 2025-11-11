const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const base = process.cwd();
const geo = process.argv[2] || path.resolve(base, 'data', 'provider-regions.json');
console.log('Using geojson:', geo);
if (!fs.existsSync(geo)) { console.error('GeoJSON not found:', geo); process.exit(2); }
console.log('Running import-regions with --map-prop=iso_a3');
let r = spawnSync('node', [path.resolve(base,'scripts','import-regions.js'), geo, '--map-prop=iso_a3'], { stdio: 'inherit' });
if (r.status !== 0) { console.error('import-regions failed'); process.exit(r.status); }
console.log('Calling /api/locations/diagnose');
try {
  const out = require('child_process').execSync(`curl -sS 'http://127.0.0.1:3000/api/locations/diagnose'`, { encoding: 'utf8' });
  console.log('diagnose returned length', out.length);
} catch (e) { console.error('diagnose failed', e); process.exit(2); }
console.log('Posting batch assign for a single known location (if present)');
try {
  const assign = [{ id: 'binance-aws-tokyo', region: 'JPN' }];
  const res = require('child_process').execSync(`curl -sS -X POST -H 'Content-Type: application/json' -d '${JSON.stringify({assignments: assign})}' 'http://127.0.0.1:3000/api/locations/assign'`, { encoding: 'utf8' });
  console.log('assign response', res.trim());
} catch (e) { console.error('assign call failed', e); process.exit(2); }
console.log('smoke test completed');
