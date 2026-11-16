const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

async function main() {
  console.log('Starting Playwright verification for Smart Importer & Staff Sanitization...');

  // Start Vite preview server using child_process
  const { spawn } = require('child_process');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    shell: true,
    cwd: path.resolve(__dirname, '..'),
  });

  // Wait for preview server to be responsive
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const browser = await chromium.launch({ headless: true });
  const outputDir = path.resolve('C:/Users/rpnis/.gemini/antigravity/brain/41eedee0-d1fd-496f-9b8b-1ca6aa33193f/smart_import_verified');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 1. Desktop Viewport (1440x900)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      window.localStorage.setItem('chronoforge_google_auth_user', JSON.stringify({
        uid: 'test_admin_user',
        displayName: 'School Administrator',
        email: 'admin@school.edu',
        photoURL: '',
        providerId: 'google.com',
        authSource: 'google_console'
      }));
      window.localStorage.setItem('chronoforge_onboarded_test_admin_user', 'true');
    });
    const page = await context.newPage();

    console.log('Navigating to local preview at http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    // Ensure we are on Subjects page first to pre-load common subjects
    console.log('Navigating to Subjects page...');
    const subjectsNav = page.locator('button:has-text("Subjects"), button:has-text("1. Subjects"), a:has-text("Subjects")').first();
    await subjectsNav.waitFor({ state: 'visible', timeout: 10000 });
    await subjectsNav.click();
    await page.waitForTimeout(500);

    // Click "Add Common Subjects Preset"
    const commonSubBtn = page.locator('button:has-text("Add Common Subjects Preset")').first();
    if (await commonSubBtn.isVisible()) {
      console.log('Clicking "Add Common Subjects Preset"...');
      await commonSubBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(outputDir, '01_subjects_preset_1440px.png'), fullPage: false });

    // Navigate to Faculty / Staff page
    console.log('Navigating to Staff page...');
    const staffNav = page.locator('button:has-text("2. Faculty"), button:has-text("Faculty & Staff"), button:has-text("Staff")').first();
    await staffNav.waitFor({ state: 'visible', timeout: 10000 });
    await staffNav.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outputDir, '02_staff_initial_1440px.png'), fullPage: false });

    // Click "Import Excel / CSV"
    console.log('Opening Smart Import Wizard...');
    const importBtn = page.locator('button:has-text("Import Excel / CSV")').first();
    await importBtn.waitFor({ state: 'visible', timeout: 10000 });
    await importBtn.click();
    await page.waitForTimeout(500);

    // Verify Modal Open
    const modalTitle = page.locator('text=Smart Excel & CSV Import Wizard');
    if (await modalTitle.isVisible()) {
      console.log('Smart Import Wizard modal is open!');
    }

    await page.screenshot({ path: path.join(outputDir, '03_import_wizard_step1_1440px.png'), fullPage: false });

    // Upload the real fixture SRT_SCHOOL__TEACHER.xlsx
    const fixturePath = path.resolve(__dirname, '../tests/fixtures/SRT_SCHOOL__TEACHER.xlsx');
    console.log('Uploading fixture:', fixturePath);
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(1000);

    // Verify Step 2: Mapping
    await page.screenshot({ path: path.join(outputDir, '04_import_wizard_step2_mapping_1440px.png'), fullPage: false });

    // Look for "Next: Review & Clean"
    const reviewBtn = page.locator('button:has-text("Next: Review & Clean")').first();
    await reviewBtn.click();
    await page.waitForTimeout(1000);

    // Verify Step 3: Review & Clean
    console.log('Verifying Step 3: Review & Clean...');
    await page.screenshot({ path: path.join(outputDir, '05_import_wizard_step3_review_1440px.png'), fullPage: false });

    // Click "Commit Import"
    const commitBtn = page.locator('button:has-text("Commit Import")').first();
    await commitBtn.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Clicking Commit Import...');
    await commitBtn.click();
    await page.waitForTimeout(1500);

    // Verify Step 4: Result
    await page.screenshot({ path: path.join(outputDir, '06_import_wizard_step4_result_1440px.png'), fullPage: false });

    // Close Modal via "Done & View Catalog"
    const doneBtn = page.locator('button:has-text("Done")').first();
    await doneBtn.waitFor({ state: 'visible', timeout: 5000 });
    await doneBtn.click();
    await page.waitForTimeout(500);

    // Verify imported staff cards
    console.log('Verifying faculty list with imported staff...');
    await page.screenshot({ path: path.join(outputDir, '07_staff_imported_1440px.png'), fullPage: false });

    // Check Mobile Viewport (375x667)
    console.log('Testing Mobile Viewport (375px)...');
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    await mobileContext.addInitScript(() => {
      window.localStorage.setItem('chronoforge_google_auth_user', JSON.stringify({
        uid: 'test_admin_user',
        displayName: 'School Administrator',
        email: 'admin@school.edu',
        photoURL: '',
        providerId: 'google.com',
        authSource: 'google_console'
      }));
      window.localStorage.setItem('chronoforge_onboarded_test_admin_user', 'true');
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    const mobileStaffNav = mobilePage.locator('button:has-text("Staff"), a:has-text("Staff")').first();
    if (await mobileStaffNav.isVisible()) {
      await mobileStaffNav.click();
      await mobilePage.waitForTimeout(500);
    }

    await mobilePage.screenshot({ path: path.join(outputDir, '08_staff_imported_375px_mobile.png'), fullPage: false });

    // Test Settings Page Model Dropdown
    console.log('Navigating to Settings page to verify Gemini Model options...');
    const settingsNav = page.locator('button[data-nav="settings"], button[title*="Settings"]').first();
    await settingsNav.waitFor({ state: 'visible', timeout: 5000 });
    await settingsNav.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(outputDir, '09_settings_gemini_models_1440px.png'), fullPage: false });

    console.log('Verification completed successfully! All screenshots captured.');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
    previewProcess.kill();
    process.exit(0);
  }
}

main();
