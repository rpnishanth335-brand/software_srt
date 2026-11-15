import { chromium } from 'playwright';
import path from 'path';

async function capturePhase5() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Click Load Demo School
  const loadDemoBtn = page.locator('button', { hasText: 'Load Demo School' });
  await loadDemoBtn.click();
  await page.waitForTimeout(600);

  // Jump to Step 8
  const step8Btn = page.locator('button', { hasText: 'Generate' });
  await step8Btn.click();
  await page.waitForTimeout(600);

  // Forge Timetable
  const forgeBtn = page.locator('button', { hasText: 'FORGE FULL TIMETABLE' });
  await forgeBtn.click();
  console.log('Forging timetable with Web Worker...');

  // Wait for solver completion
  const viewWorkspaceBtn = page.locator('button', { hasText: 'View Timetable Workspace' });
  await viewWorkspaceBtn.waitFor({ state: 'visible', timeout: 15000 });
  await viewWorkspaceBtn.click();
  await page.waitForTimeout(800);

  console.log('Arrived at Step 9 View & Edit Workspace!');

  // 1. Capture Class Grid View
  const sc1 = path.join(artifactDir, 'phase5_view_by_class.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured Class Grid View:', sc1);

  // 2. Switch to By Teacher view
  const teacherTabBtn = page.locator('button', { hasText: 'By Faculty Member' });
  await teacherTabBtn.click();
  await page.waitForTimeout(600);
  const sc2 = path.join(artifactDir, 'phase5_view_by_teacher.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured Faculty Grid View:', sc2);

  // 3. Switch to Master Grid view
  const masterTabBtn = page.locator('button', { hasText: 'Master Grid' });
  await masterTabBtn.click();
  await page.waitForTimeout(600);
  const sc3 = path.join(artifactDir, 'phase5_view_master.png');
  await page.screenshot({ path: sc3, fullPage: true });
  console.log('Captured Master Grid View:', sc3);

  // 4. Switch back to By Class Cohort
  const classTabBtn = page.locator('button', { hasText: 'By Class Cohort' });
  await classTabBtn.click();
  await page.waitForTimeout(500);

  // 5. Open Version History Modal
  const versionsBtn = page.locator('button', { hasText: 'Versions' });
  await versionsBtn.click();
  await page.waitForTimeout(500);
  const sc4 = path.join(artifactDir, 'phase5_version_history.png');
  await page.screenshot({ path: sc4, fullPage: true });
  console.log('Captured Version History Modal:', sc4);

  // Close modal via Close button
  const closeBtn = page.locator('button[aria-label="Close modal"]');
  await closeBtn.click();
  await page.waitForTimeout(500);

  // 6. Test Cell Pinning
  const lockButtons = page.locator('button[title="Lock slot to pin"]');
  const count = await lockButtons.count();
  if (count > 0) {
    console.log(`Found ${count} lockable cell buttons. Pinning first 2 cells...`);
    await lockButtons.nth(0).click({ force: true });
    await page.waitForTimeout(200);
    await lockButtons.nth(1).click({ force: true });
    await page.waitForTimeout(300);
  }

  // 7. Capture pinned state
  const sc5 = path.join(artifactDir, 'phase5_pinned_cell.png');
  await page.screenshot({ path: sc5, fullPage: true });
  console.log('Captured Pinned Cell state:', sc5);

  // 8. Test Undo Button
  const undoBtn = page.locator('button[title*="Undo"]');
  await undoBtn.click();
  await page.waitForTimeout(300);

  await browser.close();
  console.log('Phase 5 verification script completed successfully!');
}

capturePhase5().catch((err) => {
  console.error('Phase 5 verification error:', err);
  process.exit(1);
});
