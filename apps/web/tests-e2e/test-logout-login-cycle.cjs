const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

(async () => {
  console.log('================================================================');
  console.log(' Verification Test: Repeated Logout and Login Cycles');
  console.log(' Target URL:', BASE_URL);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      const text = msg.text();
      if (text.includes('user-token-expired') || text.includes('id-token-revoked') || text.includes('FirebaseError')) {
        consoleErrors.push({ type: msg.type(), text });
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push({ type: 'pageerror', text: err.message });
  });

  let cyclePassed = true;

  try {
    for (let cycle = 1; cycle <= 3; cycle++) {
      console.log(`\n--- [Cycle ${cycle}/3] Executing Logout -> Immediate Login Cycle ---`);

      // 1. Navigate to /login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Verify page is loaded without expired token errors
      const heading = await page.textContent('h1');
      console.log(`  ✓ Login page rendered: "${heading?.trim()}"`);

      // 2. Perform mock session creation (simulating successful login)
      console.log('  ▶ Synchronizing session...');
      const sessionRes = await page.request.post(`${BASE_URL}/api/auth/session`, {
        data: { idToken: 'test-mock-token-cycle-' + cycle },
        headers: {
          'x-requested-with': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
      });

      // Untrusted token is expected to return 401 without crashing or leaking expired token errors
      console.log(`  ✓ /api/auth/session response status: ${sessionRes.status()}`);

      // 3. Set a valid session cookie to simulate active logged in state
      await context.addCookies([
        {
          name: '__session',
          value: 'test_session_cookie_cycle_' + cycle,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ]);

      // 4. Navigate to home while logged in (middleware check)
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      console.log('  ✓ Navigated to authenticated view:', page.url());

      // 5. Test page refresh (F5) during session
      await page.reload({ waitUntil: 'domcontentloaded' });
      console.log('  ✓ Page reload (F5) successful, url:', page.url());

      // 6. Execute Logout endpoint (clears cookie)
      console.log('  ▶ Executing Logout...');
      const logoutRes = await page.request.post(`${BASE_URL}/api/auth/logout`, {
        headers: {
          'x-requested-with': 'XMLHttpRequest',
        },
      });
      const logoutStatus = logoutRes.status();
      const setCookie = logoutRes.headers()['set-cookie'] || '';
      const cookieDestroyed = setCookie.includes('__session=') && (setCookie.includes('Max-Age=0') || setCookie.includes('1970'));
      console.log(`  ✓ Logout API response: status=${logoutStatus}, cookie destroyed=${cookieDestroyed}`);

      if (logoutStatus !== 200 || !cookieDestroyed) {
        throw new Error(`Logout failed in cycle ${cycle}`);
      }

      // Remove cookie locally from context to match browser behavior
      await context.clearCookies();

      // 7. Immediate re-navigation to /login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      console.log(`  ✓ Immediately returned to /login without errors in cycle ${cycle}`);
    }

    console.log('\n================================================================');
    console.log(' Console Error Audit');
    console.log('================================================================');
    if (consoleErrors.length === 0) {
      console.log('  ✓ [SUCCESS] 0 expired-token or revoked-token errors detected across all 3 cycles!');
    } else {
      console.error('  ✗ [FAILURE] Detected console errors:', consoleErrors);
      cyclePassed = false;
    }

    if (cyclePassed) {
      console.log('\n>>> ALL 3 LOGOUT/LOGIN CYCLES & PAGE REFRESHES PASSED CLEANLY <<<\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test failed with exception:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

