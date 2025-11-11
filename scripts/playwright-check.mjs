import fs from 'fs';
import { chromium } from 'playwright';
(async ()=>{
  const url = process.env.URL || 'http://localhost:3001';
  const out = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => out.push({type: 'console', text: msg.text(), location: msg.location()}));
  page.on('pageerror', err => out.push({type: 'pageerror', text: String(err)}));
  page.on('requestfailed', req => out.push({type: 'requestfailed', url: req.url(), err: req.failure()?.errorText}));
  await page.goto(url, { waitUntil: 'networkidle' , timeout: 30000}).catch(err=>out.push({type:'goto-error', text: String(err)}));
  await page.screenshot({ path: '/tmp/topology-screenshot.png', fullPage: true }).catch(()=>{});
  fs.writeFileSync('/tmp/playwright-console.json', JSON.stringify(out, null, 2));
  console.log('done');
  await browser.close();
})();
