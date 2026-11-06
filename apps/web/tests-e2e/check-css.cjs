const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.url().includes('css') || res.status() >= 400) {
      console.log('RESPONSE:', res.status(), res.url(), res.headers()['content-type']);
    }
  });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  const styleInfo = await page.evaluate(() => {
    return {
      styleSheetsCount: document.styleSheets.length,
      links: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => ({
        href: l.href,
        sheet: !!l.sheet,
        rulesCount: l.sheet ? l.sheet.cssRules.length : 0
      })),
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyFont: window.getComputedStyle(document.body).fontFamily,
      h1FontSize: document.querySelector('h1') ? window.getComputedStyle(document.querySelector('h1')).fontSize : null
    };
  });

  console.log('STYLE INFO:', JSON.stringify(styleInfo, null, 2));

  await page.screenshot({ path: 'apps/web/tests-e2e/screenshots/check-login.png' });
  await browser.close();
})();
