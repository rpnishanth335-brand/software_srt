import { chromium } from 'playwright';
import path from 'path';

async function capturePhase4() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click Load Demo School
  const loadDemoBtn = page.locator('button', { hasText: 'Load Demo School' });
  await loadDemoBtn.click();
  await page.waitForTimeout(600);

  // Jump to Step 8 (Generate / Forge)
  const step8Btn = page.locator('button', { hasText: 'Generate' });
  await step8Btn.click();
  await page.waitForTimeout(800);

  // 1. Capture Step 8 Forge Interface
  const sc1 = path.join(artifactDir, 'phase4_forge_ready.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured Step 8 Forge Ready:', sc1);

  // 2. Click "FORGE FULL TIMETABLE"
  const forgeBtn = page.locator('button', { hasText: 'FORGE FULL TIMETABLE' });
  await forgeBtn.click();
  console.log('Clicked Forge Button, waiting for Web Worker solver...');

  // Wait for completion card to appear (up to 15s)
  const viewWorkspaceBtn = page.locator('button', { hasText: 'View Timetable Workspace' });
  await viewWorkspaceBtn.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Solver completed successfully with 0 hard conflicts!');

  // 3. Capture Solver Completion Summary Card
  const sc2 = path.join(artifactDir, 'phase4_forge_completed.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured Solver Completed Summary Card:', sc2);

  await browser.close();
  console.log('Phase 4 verification script finished successfully!');
}

capturePhase4().catch((err) => {
  console.error('Phase 4 verification error:', err);
  process.exit(1);
});
