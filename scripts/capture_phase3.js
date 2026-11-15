import { chromium } from 'playwright';
import path from 'path';

async function capturePhase3() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click "Load Demo School" to ensure clean known-feasible state
  const loadDemoBtn = page.locator('button', { hasText: 'Load Demo School' });
  await loadDemoBtn.click();
  await page.waitForTimeout(600);

  // Navigate directly to Step 7 (Feasibility)
  const step7Btn = page.locator('button', { hasText: 'Feasibility' });
  await step7Btn.click();
  await page.waitForTimeout(800);

  // 1. Capture Feasible State
  const sc1 = path.join(artifactDir, 'phase3_feasibility_clean.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured Clean Feasibility Report:', sc1);

  // 2. Introduce an intentional infeasibility in Step 5 (over-allocate class)
  const step5Btn = page.locator('button', { hasText: 'Assignments' });
  await step5Btn.click();
  await page.waitForTimeout(600);

  // Find first number input in table (Grade 8A Maths) and bump from 6 to 10 (+4 over allocation)
  const firstPeriodInput = page.locator('tbody tr input[type="number"]').first();
  await firstPeriodInput.fill('10');
  await page.waitForTimeout(500);

  // Return to Step 7 (Feasibility)
  await step7Btn.click();
  await page.waitForTimeout(800);

  // 3. Capture Infeasible State with Blocking Error & Fix Suggestion
  const sc2 = path.join(artifactDir, 'phase3_feasibility_infeasible.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured Infeasible Report with Fix Suggestions:', sc2);

  // Verify that Generate button is disabled
  const forgeBtn = page.locator('button', { hasText: 'Blocked by Conflicts' });
  const isDisabled = await forgeBtn.isDisabled();
  console.log('Is Forge button locked when infeasible?', isDisabled);
  if (!isDisabled) {
    throw new Error('Generate button should be locked when blocking errors exist!');
  }

  // Restore clean demo school
  await loadDemoBtn.click();
  await page.waitForTimeout(500);

  await browser.close();
  console.log('Phase 3 verification script finished successfully!');
}

capturePhase3().catch((err) => {
  console.error('Phase 3 error:', err);
  process.exit(1);
});
