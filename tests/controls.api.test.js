const fetch = require('node-fetch');

describe('controls APIs', () => {
  test('GET /api/locations returns array', async () => {
    const port = process.env.NEXT_PORT || process.env.PORT || '3000';
    const res = await fetch(`http://localhost:${port}/api/locations`);
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(Array.isArray(j)).toBe(true);
  });

  test('POST /api/locations/assign returns json', async () => {
    const port = process.env.NEXT_PORT || process.env.PORT || '3000';
    const res = await fetch(`http://localhost:${port}/api/locations/assign`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ id: 'nonexistent', region: 'XX-1' }) });
    expect(res.ok).toBe(true);
    const j = await res.json();
    expect(j).toHaveProperty('ok');
  });
});
