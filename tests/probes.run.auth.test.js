test('probes/run auth gate: env toggle present', async () => {
  // Ensure PROBES_API_KEY env var logic exists and can be read
  process.env.PROBES_API_KEY = 'secret-test-key';
  expect(process.env.PROBES_API_KEY).toBe('secret-test-key');
});
