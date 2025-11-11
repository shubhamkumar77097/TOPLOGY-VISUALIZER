#!/usr/bin/env node
// UI smoke test using Playwright (optional). Install playwright first: npm i -D playwright
(async()=>{
  try {
    const pw = require('playwright');
    const browser = await pw.chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 5000 });
    // look for canvas or globe container
    const hasCanvas = await page.$('canvas') !== null;
    console.log('hasCanvas=', !!hasCanvas);
    await browser.close();
    process.exit(hasCanvas ? 0 : 2);
  } catch (e) {
    console.error('Playwright not available or test failed', e.message || e);
    process.exit(2);
  }
})();
