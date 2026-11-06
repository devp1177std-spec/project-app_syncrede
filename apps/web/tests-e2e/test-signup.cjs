const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(500);
  const errors = await page.locator('.text-red-500').allTextContents();
  console.log('Signup validation errors:', errors);

  await browser.close();
})();
