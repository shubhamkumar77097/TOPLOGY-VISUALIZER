#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/component/Scene.tsx',
  'src/component/Topology.tsx'
];

function checkFile(relPath) {
  const p = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(p)) return null;
  const txt = fs.readFileSync(p, 'utf8');
  const canvasRe = /<Canvas[\s\S]*?<\/Canvas>/g;
  const matches = txt.match(canvasRe) || [];
  const problems = [];
  matches.forEach((m, idx) => {
    // look for lowercase tag starts like <div, <span, <canvas, <img, etc.
    const domTag = /<\s*[a-z][a-z0-9-]*/g;
    let mm;
    while ((mm = domTag.exec(m)) !== null) {
      const tag = mm[0];
      // allow react fragments and comments
      if (tag === '<svg' || tag === '<path' || tag === '<line' || tag === '<defs' || tag === '<g') {
        // svg inside Canvas is okay if it's inside <Html> or created programmatically; flag anyway for manual review
        problems.push({ index: idx, tag, pos: mm.index });
      } else {
        problems.push({ index: idx, tag, pos: mm.index });
      }
    }
  });
  return problems.length ? problems : null;
}

let any = false;
filesToCheck.forEach((f) => {
  const res = checkFile(f);
  if (res) {
    any = true;
    console.log('Potential DOM inside <Canvas> in', f);
    res.forEach(r => console.log(' -', r.tag, 'at canvas-child-index', r.index, 'pos', r.pos));
  }
});
if (!any) console.log('No obvious lowercase DOM tags found inside <Canvas> in checked files.');
