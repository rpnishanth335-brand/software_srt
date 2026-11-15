import { chromium } from 'playwright';
import path from 'path';

async function capturePhase2() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Step 1 — School Basics
  const sc1 = path.join(artifactDir, 'phase2_step1_basics.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured Step 1 Basics:', sc1);

  // 2. Click Next -> Step 2 Classes
  const nextBtn = page.locator('button', { hasText: 'Save & Continue' });
  await nextBtn.click();
  await page.waitForTimeout(600);
  const sc2 = path.join(artifactDir, 'phase2_step2_classes.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured Step 2 Classes:', sc2);

  // 3. Click Next -> Step 3 Subjects
  await nextBtn.click();
  await page.waitForTimeout(600);
  const sc3 = path.join(artifactDir, 'phase2_step3_subjects.png');
  await page.screenshot({ path: sc3, fullPage: true });
  console.log('Captured Step 3 Subjects:', sc3);

  // 4. Click Next -> Step 4 Staff
  await nextBtn.click();
  await page.waitForTimeout(600);
  // Expand first teacher's availability grid
  const availGridBtn = page.locator('button', { hasText: 'Blocked Slots' }).first();
  if (await availGridBtn.isVisible()) {
    await availGridBtn.click();
    await page.waitForTimeout(400);
  }
  const sc4 = path.join(artifactDir, 'phase2_step4_staff.png');
  await page.screenshot({ path: sc4, fullPage: true });
  console.log('Captured Step 4 Staff:', sc4);

  // 5. Click Next -> Step 5 Assignments Matrix
  await nextBtn.click();
  await page.waitForTimeout(600);
  const sc5 = path.join(artifactDir, 'phase2_step5_matrix.png');
  await page.screenshot({ path: sc5, fullPage: true });
  console.log('Captured Step 5 Matrix:', sc5);

  // 6. Click Next -> Step 6 Rules
  await nextBtn.click();
  await page.waitForTimeout(600);
  const sc6 = path.join(artifactDir, 'phase2_step6_rules.png');
  await page.screenshot({ path: sc6, fullPage: true });
  console.log('Captured Step 6 Rules:', sc6);

  // 7. Verify Data Persistence on Reload
  console.log('Testing reload persistence...');
  // Go back to Step 1
  const step1Btn = page.locator('button', { hasText: 'School Basics' });
  await step1Btn.click();
  await page.waitForTimeout(500);

  // Edit School Name
  const schoolInput = page.locator('input[placeholder*="St. Jude"]');
  await schoolInput.fill('St. Jude Apex Academy (Persisted)');
  await page.waitForTimeout(600); // allow debounce save

  // Reload the page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify the edited name is retained
  const reloadedVal = await page.locator('input[placeholder*="St. Jude"]').inputValue();
  console.log('Value after reload:', reloadedVal);
  if (!reloadedVal.includes('(Persisted)')) {
    throw new Error('Data persistence failed on reload!');
  }
  console.log('Persistence test passed with flying colors!');

  const sc7 = path.join(artifactDir, 'phase2_persistence_verified.png');
  await page.screenshot({ path: sc7, fullPage: true });

  await browser.close();
  console.log('Phase 2 verification script completed successfully!');
}

capturePhase2().catch((err) => {
  console.error('Phase 2 verification error:', err);
  process.exit(1);
});
