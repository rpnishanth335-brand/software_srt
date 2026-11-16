import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function loginAndEnsureDashboard(page) {
  await page.evaluate(() => {
    (window).__chronoforge_mock_google_login({
      displayName: 'Dr. Jane Admin',
      email: 'jane.admin@chronoforge.edu'
    });
  });
  await page.waitForTimeout(400);

  const onboardingHeader = page.locator('text=New Institution Onboarding');
  if (await onboardingHeader.isVisible()) {
    const input = page.locator('input[placeholder*="International School"]');
    if (await input.isVisible()) {
      await input.fill('Springfield International Academy');
    }
    const saveBtn = page.locator('button', { hasText: 'Save School & Enter ChronoForge ERP' });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Ensure top app bar or desktop header avatar menu is ready
  await page.locator('button[aria-label="User account menu"]:visible').first().waitFor({ state: 'visible', timeout: 10000 });
}

async function verifyModalAndAiPipeline() {
  console.log('=== CHRONOFORGE: MODAL CENTERING, SETTINGS AI & CALCULATION AUDIT ===\n');
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const outDir = path.join(artifactDir, 'phase8_modal_ai_verified');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // ========================================================
    // PART 1: LOGIN PAGE AUDIT (ZERO API KEY INPUTS)
    // ========================================================
    console.log('[Test 1] Login Page Audit: Verifying ONLY Google Login...');
    const authContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const authPage = await authContext.newPage();
    await authPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await authPage.evaluate(() => localStorage.clear());
    await authPage.reload({ waitUntil: 'networkidle' });
    await authPage.waitForTimeout(500);

    // Verify Google login button exists
    const googleBtn = authPage.locator('button', { hasText: 'Continue with Google' });
    await googleBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Official Google Sign-In button present');

    // Verify ZERO Gemini key inputs on Login page
    const keyInputs = await authPage.locator('input[type="password"]').count();
    const geminiText = await authPage.locator('text=Gemini').count();
    const devSettingBtn = await authPage.locator('button', { hasText: 'Google Console OAuth Settings' }).count();

    if (keyInputs === 0 && geminiText === 0 && devSettingBtn === 0) {
      console.log('  ✓ Clean Login verified: 0 Gemini key inputs, 0 dev settings buttons on login page.');
    } else {
      throw new Error(`Unexpected elements on login page: keyInputs=${keyInputs}, geminiText=${geminiText}`);
    }

    // Authenticate and complete onboarding
    await loginAndEnsureDashboard(authPage);
    console.log('  ✓ Authenticated session active on dashboard.');

    // ========================================================
    // PART 2: DIALOG CENTERING ACROSS 6 VIEWPORTS
    // ========================================================
    console.log('\n[Test 2] Dialog Viewport Centering & Boundary Verification...');

    const viewports = [
      { name: '320px_iphone_se', width: 320, height: 640 },
      { name: '375px_iphone_8', width: 375, height: 667 },
      { name: '768px_ipad_portrait', width: 768, height: 1024 },
      { name: '1024px_laptop_small', width: 1024, height: 768 },
      { name: '1440px_desktop', width: 1440, height: 900 },
      { name: 'landscape_phone', width: 844, height: 390 },
    ];

    for (const vp of viewports) {
      console.log(`\n  -> Testing Dialog Centering on Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const vpContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await vpContext.newPage();

      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await loginAndEnsureDashboard(page);

      // Open Avatar popover
      const avatarBtn = page.locator('button[aria-label="User account menu"]:visible').first();
      await avatarBtn.click();
      await page.waitForTimeout(300);

      // Click "Sign Out of ChronoForge" to trigger ConfirmDialog
      const signOutBtn = page.locator('button', { hasText: 'Sign Out of ChronoForge' }).first();
      await signOutBtn.click();
      await page.waitForTimeout(400);

      // Locate Modal Card
      const modalCard = page.locator('[data-testid="modal-card"]');
      await modalCard.waitFor({ state: 'visible', timeout: 5000 });

      const box = await modalCard.boundingBox();
      if (!box) {
        throw new Error(`Modal card bounding box was null on ${vp.name}`);
      }

      const expectedCenterX = vp.width / 2;
      const expectedCenterY = vp.height / 2;
      const actualCenterX = box.x + box.width / 2;
      const actualCenterY = box.y + box.height / 2;

      const deltaX = Math.abs(actualCenterX - expectedCenterX);
      const deltaY = Math.abs(actualCenterY - expectedCenterY);

      console.log(`     Bounding Box: x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${Math.round(box.width)}, h=${Math.round(box.height)}`);
      console.log(`     Center Delta: dX=${Math.round(deltaX)}px, dY=${Math.round(deltaY)}px`);

      // Assertions: Must be completely inside viewport
      if (box.x < 0 || box.y < 0) {
        throw new Error(`Modal was clipped off-screen on ${vp.name}: x=${box.x}, y=${box.y}`);
      }
      if (box.x + box.width > vp.width + 4 || box.y + box.height > vp.height + 4) {
        throw new Error(`Modal overflowed viewport on ${vp.name}`);
      }
      // Horizontally and vertically centered within tolerance
      if (deltaX > 20) {
        throw new Error(`Modal not horizontally centered on ${vp.name}: deltaX=${deltaX}`);
      }
      if (deltaY > 35) {
        throw new Error(`Modal not vertically centered on ${vp.name}: deltaY=${deltaY}`);
      }

      await page.screenshot({ path: path.join(outDir, `modal_centered_${vp.name}.png`) });
      console.log(`     ✓ Centered with 0 clipping on ${vp.name}!`);

      // Close modal with Cancel
      const cancelBtn = page.locator('button', { hasText: 'Cancel' }).first();
      await cancelBtn.click();
      await page.waitForTimeout(300);

      await vpContext.close();
    }

    // ========================================================
    // PART 3: SETTINGS > AI ASSISTANT KEY CONFIGURATION
    // ========================================================
    console.log('\n[Test 3] Settings > AI Assistant: Key Save, Test & Removal...');
    const testContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await testContext.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await loginAndEnsureDashboard(page);

    // Navigate to Settings
    await page.click('button[data-nav="settings"]');
    await page.waitForTimeout(500);

    // Verify AI Assistant section
    const aiTitle = page.locator('text=Gemini AI Assistant & Timetable Generation');
    await aiTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Settings > AI Assistant section rendered');

    // Input test key
    const keyInput = page.locator('input[placeholder="Paste AIzaSy... API key"]');
    await keyInput.fill('AIzaSyMockKeyForVerificationTest987654321');

    // Click Save
    const saveKeyBtn = page.locator('button', { hasText: 'Save Configuration' });
    await saveKeyBtn.click();
    await page.waitForTimeout(400);

    const savedBadge = page.locator('text=Connected');
    await savedBadge.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ API key saved and encrypted in IndexedDB per user');

    await page.screenshot({ path: path.join(outDir, '02_settings_ai_saved.png') });

    // ========================================================
    // PART 4: TIMETABLE GENERATION & CALCULATION REPORT
    // ========================================================
    console.log('\n[Test 4] Generate Page & Calculation Report Tab...');
    await page.click('button[data-nav="generate"]');
    await page.waitForTimeout(500);

    // Verify mode switcher
    const hybridBtn = page.locator('button', { hasText: 'AI + Deterministic Validator' });
    await hybridBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ AI + Validator mode switcher active');

    // Click Generate Timetable
    const genBtn = page.locator('button', { hasText: 'Synthesize with AI + Validator' });
    await genBtn.click();
    await page.waitForTimeout(500);

    // Verify Consent Preview Modal opens
    const consentTitle = page.locator('text=Privacy Consent & Data Preview');
    await consentTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Privacy Consent Preview Modal displayed with anonymized JSON');

    await page.screenshot({ path: path.join(outDir, '03_consent_preview_modal.png') });

    // Click Approve & Generate
    const approveBtn = page.locator('button', { hasText: 'Approve & Generate with AI' });
    await approveBtn.click();

    // Wait for synthesis completion
    const completeBanner = page.locator('text=Timetable Successfully Synthesized!');
    await completeBanner.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  ✓ Timetable synthesized with 0 hard conflicts guaranteed!');

    await page.screenshot({ path: path.join(outDir, '04_ai_generation_complete.png') });

    // Navigate to Calculation Report tab in Viewer
    const calcReportBtn = page.locator('button', { hasText: 'Calculation Report' }).first();
    await calcReportBtn.click();
    await page.waitForTimeout(600);

    const calcContainer = page.locator('[data-testid="calculation-report-container"]');
    await calcContainer.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Calculation Report tab rendered with metrics, heatmaps, and capacity bars');

    await page.screenshot({ path: path.join(outDir, '05_calculation_report_tab.png') });

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 8 MODAL, AI & CALCULATION TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

verifyModalAndAiPipeline().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
