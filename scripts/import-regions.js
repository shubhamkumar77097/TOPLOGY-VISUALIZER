#!/usr/bin/env node
// Usage: node scripts/import-regions.js /path/to/provider-regions.geojson
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const argv = process.argv.slice(2);
if (!argv[0]) { console.error('Usage: import-regions.js <file>'); process.exit(2); }
const src = path.resolve(argv[0]);
if (!fs.existsSync(src)) { console.error('File not found', src); process.exit(2); }
const base = process.cwd();
const dst = path.resolve(base, 'data', 'provider-regions.json');
fs.copyFileSync(src, dst);
console.log('Copied regions to', dst);
// run importer to import into sqlite and assign region codes
const args = [path.resolve(base, 'scripts', 'import-data.js'), '--regions', dst, '--import-sqlite'];
// forward optional --map-prop
for (let i = 1; i < process.argv.length; i++) {
	if (process.argv[i].startsWith('--map-prop')) args.push(process.argv[i]);
}
const r = child.spawnSync('node', args, { stdio: 'inherit' });
process.exit(r.status);
