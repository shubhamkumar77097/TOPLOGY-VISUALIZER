#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) walk(res, cb);
    else cb(res);
  }
}

const hookRegex = /\b(useFrame|useThree|useLoader|useGraph|useFBO)\b/;
const domTagRegex = /<\s*(div|span|canvas|img|section|header|footer|button|input|a)\b/i;

let problems = [];

walk(SRC, (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts') && !file.endsWith('.jsx') && !file.endsWith('.js')) return;
  const txt = fs.readFileSync(file, 'utf8');
  if (hookRegex.test(txt) && domTagRegex.test(txt)) {
    problems.push(file);
  }
});

if (problems.length) {
  console.log('\nPotential r3f DOM-in-Canvas issues found in:');
  problems.forEach(p => console.log(' -', path.relative(ROOT, p)));
  console.log('\nThis is a heuristic scan. Review the listed files for DOM elements returned from r3f components.');
  process.exitCode = 2;
} else {
  console.log('No obvious r3f DOM-in-Canvas issues detected.');
}
