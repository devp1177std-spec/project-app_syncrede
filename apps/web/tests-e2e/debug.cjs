const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  console.log('--- LOGIN DEBUG ---');
  console.log('Initial password type:', await page.getAttribute('input#password', 'type'));
  const btn = page.locator('button[aria-label="Show password"]');
  console.log('Show password button visible:', await btn.isVisible());
  await btn.click();
  console.log('After click type:', await page.getAttribute('input#password', 'type'));

  // Submit empty
  console.log('Clicking Log In button...');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(500);
  console.log('Page text after click:', await page.locator('form').innerText());

  // Check invalid login
  console.log('Filling invalid credentials...');
  await page.fill('input#identifier', 'fake-user-not-exists@example.com');
  await page.fill('input#password', 'WrongPass123!');
  await page.click('button:has-text("Log In")');
  
  // Listen for request
  page.on('response', res => {
    if (res.url().includes('identitytoolkit') || res.url().includes('securetoken')) {
      console.log('Identity Toolkit Response:', res.status(), res.url());
    }
  });

  await page.waitForTimeout(4000);
  console.log('Form text after 4s:', await page.locator('form').innerText());

  console.log('\n--- FORGOT PASSWORD DEBUG ---');
  await page.goto('http://localhost:3000/forgot-password', { waitUntil: 'networkidle' });
  console.log('H1:', await page.textContent('h1'));
  console.log('Body:', await page.textContent('body'));

  await browser.close();
})();
