const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/forgot-password', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  console.log('H1:', await page.textContent('h1'));
  await page.fill('input#email', 'test-recovery@example.com');
  await page.click('button:has-text("Send Reset Link")');
  await page.waitForTimeout(3000);
  console.log('Success block:', await page.locator('.bg-emerald-50, .text-emerald-600, h1, p').allTextContents());

  await browser.close();
})();
