const fs = require('fs');
const path = require('path');

describe('visualConfig sanity', () => {
  test('MAX_ARCS is set and reasonable', () => {
    const p = path.resolve(process.cwd(), 'src/lib/visualConfig.ts');
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/export const MAX_ARCS\s*=\s*(\d+)\s*;/);
    expect(m).not.toBeNull();
    const v = Number(m[1]);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(500);
  });
});
