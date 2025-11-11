const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const JSON_FILE = path.join(ROOT, 'history.json');
const SQLITE_FILE = path.join(ROOT, 'history.sqlite');

function ts() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function backup(file) {
  if (!fs.existsSync(file)) return null;
  const dest = file + '.bak.' + ts();
  fs.copyFileSync(file, dest);
  console.log('Backed up', file, '->', dest);
  return dest;
}

async function run() {
  console.log('Backing up existing history files...');
  backup(JSON_FILE);
  backup(SQLITE_FILE);

  // Create a new sqlite DB using sqlite3 if available; otherwise create empty file
  try {
    console.log('Creating new sqlite DB (history.sqlite)...');
    // Create table with expected schema (id auto, pair, from_id, to_id, value, ts)
    execSync(`sqlite3 "${SQLITE_FILE}" "CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, pair TEXT, from_id TEXT, to_id TEXT, value INTEGER, ts INTEGER);"`);
    console.log('DB created with table `history`.');
    // seed sample
    const now = Date.now();
    execSync(`sqlite3 "${SQLITE_FILE}" "INSERT INTO history (pair, from_id, to_id, value, ts) VALUES ('loc1->loc2','loc1','loc2', 42, ${now});"`);
    console.log('Seeded sample record.');
  } catch {
    console.warn('sqlite3 not available or error creating DB; creating empty file instead.');
    try { fs.writeFileSync(SQLITE_FILE, ''); } catch (e2) { console.error('Failed to create file', e2); }
  }

  // reset JSON store
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify({ 'loc1->loc2': [{ from: 'loc1', to: 'loc2', value: 42, ts: Date.now() }] }, null, 2));
    console.log('Wrote new history.json with sample record.');
  } catch (e) { console.error('Failed writing history.json', e); }

  console.log('Done.');
}

run().catch((e) => { console.error(e); process.exit(2); });
