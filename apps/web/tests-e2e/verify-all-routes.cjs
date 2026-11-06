const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve('apps/web/tests-e2e/verification-screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const routesToTest = [
  // Public routes (no auth needed)
  { path: '/login', name: 'login', auth: false },
  { path: '/signup', name: 'signup', auth: false },
  { path: '/forgot-password', name: 'forgot-password', auth: false },
  { path: '/splash', name: 'splash', auth: false },

  // Protected routes (require __session cookie)
  { path: '/', name: 'home-feed', auth: true },
  { path: '/profile', name: 'profile', auth: true },
  { path: '/social', name: 'social', auth: true },
  { path: '/market', name: 'market', auth: true },
  { path: '/chat', name: 'chat', auth: true },
  { path: '/stories', name: 'stories', auth: true },
  { path: '/create-profile', name: 'create-profile', auth: true }
];

const viewports = [
  { name: 'desktop', width: 1280, height: 800, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`========================================\n`);

    for (const r of routesToTest) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile
      });

      if (r.auth) {
        await context.addCookies([
          {
            name: '__session',
            value: 'mock_test_session_token',
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax'
          }
        ]);
      }

      const page = await context.newPage();
      const failedRequests = [];
      const consoleErrors = [];

      page.on('requestfailed', req => {
        failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
      });

      page.on('response', res => {
        if (res.status() >= 400 && !res.url().includes('identitytoolkit') && !res.url().includes('socket.io')) {
          failedRequests.push({ url: res.url(), status: res.status() });
        }
      });

      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('socket.io')) {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        consoleErrors.push(err.message);
      });

      try {
        const response = await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(1500);

        const currentUrl = page.url();
        const status = response?.status() || 0;

        // Inspect style and stylesheet loading
        const styleMetrics = await page.evaluate(() => {
          const styleSheets = Array.from(document.styleSheets);
          let totalRules = 0;
          for (const s of styleSheets) {
            try {
              totalRules += s.cssRules ? s.cssRules.length : 0;
            } catch (e) {
              // CORS protected sheets
            }
          }

          const bodyEl = document.body;
          const bodyStyle = window.getComputedStyle(bodyEl);
          const headerEl = document.querySelector('h1, h2, header');
          const headerStyle = headerEl ? window.getComputedStyle(headerEl) : null;
          const buttonEl = document.querySelector('button');
          const buttonStyle = buttonEl ? window.getComputedStyle(buttonEl) : null;

          return {
            styleSheetsCount: styleSheets.length,
            totalRules,
            bodyBg: bodyStyle.backgroundColor,
            bodyFont: bodyStyle.fontFamily,
            headerFontSize: headerStyle?.fontSize || null,
            buttonBorderRadius: buttonStyle?.borderRadius || null,
            buttonBg: buttonStyle?.backgroundColor || null
          };
        });

        const screenshotFileName = `${vp.name}-${r.name}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotFileName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const isStyled = styleMetrics.totalRules > 50 && styleMetrics.bodyBg !== 'rgba(0, 0, 0, 0)';

        const result = {
          viewport: vp.name,
          route: r.path,
          name: r.name,
          httpStatus: status,
          finalUrl: currentUrl,
          isStyled,
          styleMetrics,
          failedRequestsCount: failedRequests.length,
          failedRequests,
          consoleErrorsCount: consoleErrors.length,
          consoleErrors,
          screenshot: screenshotFileName
        };

        results.push(result);

        const icon = isStyled && failedRequests.length === 0 ? '✓' : '✗';
        console.log(`${icon} [${vp.name}] ${r.path} -> HTTP ${status} | Stylesheet rules: ${styleMetrics.totalRules} | Styled: ${isStyled}`);
        if (failedRequests.length > 0) {
          console.log(`   ↳ Failed requests:`, JSON.stringify(failedRequests));
        }
        if (consoleErrors.length > 0) {
          console.log(`   ↳ Console errors:`, consoleErrors);
        }
      } catch (err) {
        console.error(`✗ [${vp.name}] ${r.path} FAILED:`, err.message);
        results.push({
          viewport: vp.name,
          route: r.path,
          name: r.name,
          error: err.message
        });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'verification-summary.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\nVerification complete. Summary saved to ${path.join(OUTPUT_DIR, 'verification-summary.json')}`);
})();
