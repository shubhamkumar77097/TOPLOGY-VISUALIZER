const { chromium } = require('playwright');
(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG>', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR>', err.message, err.stack));
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('Loaded, waiting 2s for client scripts...');
    await page.waitForTimeout(2000);
    console.log('Done');
  } catch (e) {
    console.error('Error during load', e);
  } finally {
    await browser.close();
  }
})();
