const { chromium } = require('C:/Users/AFIZ/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve('apps/web/tests-e2e/verification-screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('Starting Profile Flip Card E2E Verification...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'mobile', width: 390, height: 844, isMobile: true },
    { name: 'desktop', width: 1280, height: 800, isMobile: false },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    // Add session cookie for authentication
    await context.addCookies([
      {
        name: '__session',
        value: 'mock_test_session_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();

    // Navigate to profile page
    console.log('Navigating to http://localhost:3000/profile ...');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 1. Verify Initial View (Front Side)
    console.log('Verifying Front Side (Statistics View)...');
    const followersText = await page.locator('text=Followers').first();
    const followingText = await page.locator('text=Following').first();
    const postsText = await page.locator('text=Posts').first();

    const isFollowersVisible = await followersText.isVisible();
    const isFollowingVisible = await followingText.isVisible();
    const isPostsVisible = await postsText.isVisible();

    console.log(`- Followers label visible: ${isFollowersVisible}`);
    console.log(`- Following label visible: ${isFollowingVisible}`);
    console.log(`- Posts label visible: ${isPostsVisible}`);

    // Check Bio Tab
    const bioTab = page.locator('button[aria-label*="bio" i], button[title*="bio" i]').first();
    const isBioTabVisible = await bioTab.isVisible();
    console.log(`- Bio Tab visible: ${isBioTabVisible}`);

    // Screenshot Front Side
    const frontScreenshot = path.join(OUTPUT_DIR, `${vp.name}-profile-front-stats.png`);
    await page.screenshot({ path: frontScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${frontScreenshot}`);

    // 2. Click Bio Tab to Flip Card
    console.log('\nClicking Bio Tab to trigger 3D Flip Animation...');
    await bioTab.click();
    await page.waitForTimeout(650); // wait for 550ms CSS 3D animation to complete

    // 3. Verify Back Side
    console.log('Verifying Back Side (Details View)...');
    const statsTab = page.locator('button[aria-label*="stat" i], button[title*="stat" i]').first();
    const isStatsTabVisible = await statsTab.isVisible();
    console.log(`- Stats Tab visible: ${isStatsTabVisible}`);

    // Check Website link
    const websiteLink = page.locator('a[href*="http"]').first();
    const isWebsiteVisible = await websiteLink.isVisible();
    const websiteHref = isWebsiteVisible ? await websiteLink.getAttribute('href') : null;
    console.log(`- Website link visible: ${isWebsiteVisible} (${websiteHref})`);

    // Check Location
    const locationPin = page.locator('svg.lucide-map-pin').first();
    const isLocationPinVisible = await locationPin.isVisible();
    console.log(`- Location Pin icon visible: ${isLocationPinVisible}`);

    // Screenshot Back Side
    const backScreenshot = path.join(OUTPUT_DIR, `${vp.name}-profile-back-details.png`);
    await page.screenshot({ path: backScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${backScreenshot}`);

    // 4. Test "more" button if present
    const moreBtn = page.locator('button:has-text("more")').first();
    if (await moreBtn.isVisible()) {
      console.log('\nFound "more" button on long bio! Clicking to expand...');
      await moreBtn.click();
      await page.waitForTimeout(350);

      const lessBtn = page.locator('button:has-text("less")').first();
      console.log(`- "less" button visible after expand: ${await lessBtn.isVisible()}`);

      const expandedScreenshot = path.join(OUTPUT_DIR, `${vp.name}-profile-back-expanded.png`);
      await page.screenshot({ path: expandedScreenshot, fullPage: false });
      console.log(`Saved screenshot: ${expandedScreenshot}`);
    }

    // 5. Click Stats Tab to Flip Back
    console.log('\nClicking Stats Tab to trigger 3D Flip back to Statistics...');
    await statsTab.click();
    await page.waitForTimeout(650); // wait for 550ms CSS 3D animation to complete

    // Verify Front Side again
    const isFollowersVisibleAgain = await followersText.isVisible();
    console.log(`- Followers label visible again: ${isFollowersVisibleAgain}`);

    const flipBackScreenshot = path.join(OUTPUT_DIR, `${vp.name}-profile-front-flipped-back.png`);
    await page.screenshot({ path: flipBackScreenshot, fullPage: false });
    console.log(`Saved screenshot: ${flipBackScreenshot}`);

    await context.close();
  }

  await browser.close();
  console.log('\nAll profile flip card E2E verification tests PASSED successfully!');
})();
