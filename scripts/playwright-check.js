// playwright-check.js - open app, capture console logs + screenshot
const { chromium } = require('playwright');
(async () => {
  const port = process.env.PORT || process.env.NEXT_PORT || '3001';
  const url = `http://localhost:${port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  try {
    await page.goto(url, { waitUntil: 'networkidle' , timeout: 30000});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/topology-screenshot.png', fullPage: true });
    console.log('screenshot:/tmp/topology-screenshot.png');
  } catch (err) {
    console.error('page error', err && err.message);
  }
  console.log('console-entries-start');
  logs.forEach(l => console.log(JSON.stringify(l)));
  console.log('console-entries-end');
  await browser.close();
})();
