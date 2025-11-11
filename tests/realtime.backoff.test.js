// tests/realtime.backoff.test.js
// simple unit tests for backoff delay calculation used by RealtimeProvider
const { test, expect } = require('@jest/globals');

function backoffDelay(attempt) {
  const base = 1000;
  const raw = Math.min(30000, base * Math.pow(1.5, attempt));
  const jitter = raw * (0.4 * (Math.random() - 0.5));
  return Math.max(200, Math.round(raw + jitter));
}

test('backoffDelay increases with attempts and stays within bounds', () => {
  const a0 = backoffDelay(0);
  const a1 = backoffDelay(1);
  const a2 = backoffDelay(4);
  expect(a0).toBeGreaterThanOrEqual(200);
  expect(a1).toBeGreaterThanOrEqual(a0);
  expect(a2).toBeGreaterThanOrEqual(a1);
  expect(a2).toBeLessThanOrEqual(30000 * 1.4);
});

// deterministic-ish test: run many samples and ensure distribution center roughly equals raw
test('backoffDelay jitter distribution roughly centered', () => {
  const N = 200;
  const raw = Math.min(30000, 1000 * Math.pow(1.5, 2));
  let sum = 0;
  for (let i=0;i<N;i++) sum += backoffDelay(2);
  const avg = sum / N;
  expect(avg).toBeGreaterThanOrEqual(raw * 0.6);
  expect(avg).toBeLessThanOrEqual(raw * 1.4);
});
