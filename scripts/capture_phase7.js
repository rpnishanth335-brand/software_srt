import { chromium } from 'playwright';
import path from 'path';

async function capturePhase7() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Load demo school
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.waitForTimeout(600);

  // 1. Open AI Assistant Modal
  console.log('Opening AI Assistant Modal...');
  await page.locator('button', { hasText: 'AI Assistant' }).click();
  await page.waitForTimeout(600);

  const sc1 = path.join(artifactDir, 'phase7_ai_modal_parser.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured AI Modal Parser tab:', sc1);

  // 2. Test Natural Language Rule Input
  console.log('Entering natural language rule...');
  const promptInput = page.locator('textarea[placeholder*="Dr. Robert Brown"]');
  await promptInput.fill('Dr. Robert Brown cannot teach on Friday after Period 4 and prioritize morning sessions for heavy subjects');
  await page.locator('button', { hasText: 'Parse & Apply Rule' }).click();
  await page.waitForTimeout(600);

  const sc2 = path.join(artifactDir, 'phase7_ai_rule_applied.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured AI Rule Applied Result:', sc2);

  // 3. Switch to Schedule Explainer
  console.log('Testing Schedule Explainer...');
  await page.locator('button', { hasText: 'Schedule Explainer' }).click();
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Explain Schedule Placements' }).click();
  await page.waitForTimeout(500);

  const sc3 = path.join(artifactDir, 'phase7_ai_explainer.png');
  await page.screenshot({ path: sc3, fullPage: true });
  console.log('Captured AI Explainer Result:', sc3);

  // 4. Switch to Swap Suggester
  console.log('Testing Swap Suggester...');
  await page.locator('button', { hasText: 'Swap Suggester' }).click();
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Find Optimal Swaps' }).click();
  await page.waitForTimeout(500);

  const sc4 = path.join(artifactDir, 'phase7_ai_swap_suggester.png');
  await page.screenshot({ path: sc4, fullPage: true });
  console.log('Captured AI Swap Suggester Result:', sc4);

  // Close AI modal
  await page.locator('button[aria-label="Close modal"]').click();
  await page.waitForTimeout(500);

  // 5. Navigate to Step 9 (Workspace) and test Keyboard Navigation
  console.log('Testing keyboard navigation in Step 9...');
  await page.locator('button', { hasText: 'Generate' }).click();
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'FORGE FULL TIMETABLE' }).click();

  const viewWorkspaceBtn = page.locator('button', { hasText: 'View Timetable Workspace' });
  await viewWorkspaceBtn.waitFor({ state: 'visible', timeout: 15000 });
  await viewWorkspaceBtn.click();
  await page.waitForTimeout(800);

  // Test keyboard focus on first timetable cell
  const firstCell = page.locator('div[role="gridcell"]').first();
  await firstCell.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  const sc5 = path.join(artifactDir, 'phase7_keyboard_accessibility.png');
  await page.screenshot({ path: sc5, fullPage: true });
  console.log('Captured Keyboard Accessibility focus & pin state:', sc5);

  await browser.close();
  console.log('Phase 7 verification script completed successfully!');
}

capturePhase7().catch((err) => {
  console.error('Phase 7 verification error:', err);
  process.exit(1);
});
