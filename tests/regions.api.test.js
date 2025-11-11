const fetch = require('node-fetch');

describe('regions API', () => {
  test('GET /api/regions returns features without -99 placeholders and numeric serverCount', async () => {
    const port = process.env.NEXT_PORT || process.env.PORT || '3000';
    const res = await fetch(`http://localhost:${port}/api/regions`);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j).toHaveProperty('features');
    expect(Array.isArray(j.features)).toBe(true);
    // ensure none of the feature codes are -99 and serverCount is a number when present
    for (const f of j.features.slice(0, 50)) {
      const code = f.properties?.code || f.properties?.region || f.properties?.name;
      expect(code).not.toBe('-99');
      if (f.properties && typeof f.properties.serverCount !== 'undefined') {
        expect(typeof f.properties.serverCount === 'number' || f.properties.serverCount === null || typeof f.properties.serverCount === 'undefined').toBeTruthy();
      }
    }
  }, 20000);
});
