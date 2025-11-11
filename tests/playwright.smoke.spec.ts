import { test, expect } from '@playwright/test';

test('app basic smoke', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Topology|Latency/i);
  // open Controls panel and toggle heatmap
  const controlsButton = page.locator('text=Filters');
  await expect(controlsButton).toBeVisible();
  // check History panel placeholder
  await expect(page.locator('text=Select a pair to view history').first()).toBeVisible();
});
