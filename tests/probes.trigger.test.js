test('trigger route request body parsing example', async () => {
  // Simulate parsing a JSON body as the route would
  const body = JSON.stringify({ pair: 'a->b' });
  const parsed = JSON.parse(body);
  expect(parsed.pair).toBe('a->b');
});
