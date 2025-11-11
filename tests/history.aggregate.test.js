// tests/history.aggregate.test.js
// Call the running Next dev aggregation endpoint and verify response shape.
const fetch = require('node-fetch');

describe('history aggregation endpoint', () => {
  test('GET /api/history/aggregate returns expected shape', async () => {
    const port = process.env.NEXT_PORT || process.env.PORT || '3000';
    const res = await fetch(`http://localhost:${port}/api/history/aggregate?range=1h`);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j).toHaveProperty('ok', true);
    expect(j).toHaveProperty('series');
    expect(Array.isArray(j.series)).toBe(true);
    // for 1h range with default 1m buckets, expect ~60 buckets
    expect(j.series.length).toBeGreaterThanOrEqual(1);
  }, 20000);
});
