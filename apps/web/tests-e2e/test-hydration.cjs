const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console logs and errors
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('FAILED URL:', res.status(), res.url());
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // Wait for React 19 hydration

  // Test password toggle
  console.log('--- PASSWORD TOGGLE ---');
  const toggleBtn = page.locator('button[aria-label="Show password"]');
  console.log('Button exists:', await toggleBtn.count());
  await toggleBtn.click();
  console.log('Password type after toggle:', await page.getAttribute('input#password', 'type'));

  // Test form submit
  console.log('--- FORM SUBMISSION ---');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(500);
  const errors = await page.locator('.text-red-500').allTextContents();
  console.log('Validation errors:', errors);

  await browser.close();
})();
