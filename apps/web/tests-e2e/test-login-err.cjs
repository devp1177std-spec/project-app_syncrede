const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('input#identifier', 'nonexistent-qa-e2e@example.com');
  await page.fill('input#password', 'WrongPassword123!');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(3000);
  const errorText = await page.locator('.bg-red-50, .text-red-600').textContent().catch(e => e.message);
  console.log('Error text:', errorText);
  await browser.close();
})();
