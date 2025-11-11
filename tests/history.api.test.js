const fs = require('fs');
const path = require('path');

describe('history API', () => {
  test('history.json exists and is valid JSON', async () => {
    const p = path.join(__dirname, '..', 'history.json');
    const ok = fs.existsSync(p);
    expect(ok).toBe(true);
    const raw = fs.readFileSync(p, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
