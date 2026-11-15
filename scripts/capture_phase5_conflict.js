import { chromium } from 'playwright';
import path from 'path';

async function captureConflict() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.locator('button', { hasText: 'Generate' }).click();
  await page.locator('button', { hasText: 'FORGE FULL TIMETABLE' }).click();

  const viewWorkspaceBtn = page.locator('button', { hasText: 'View Timetable Workspace' });
  await viewWorkspaceBtn.waitFor({ state: 'visible', timeout: 15000 });
  await viewWorkspaceBtn.click();
  await page.waitForTimeout(1000);

  // In By Class view, let's find two cells
  // We can drag the grip icon of cell 0 to cell 1
  const grips = page.locator('svg.lucide-grip-vertical');
  const count = await grips.count();
  console.log(`Found ${count} drag grip handles.`);

  if (count >= 2) {
    const box1 = await grips.nth(0).boundingBox();
    const box2 = await grips.nth(1).boundingBox();
    if (box1 && box2) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      // Move in increments > 8px
      await page.mouse.move(box1.x + 20, box1.y + 20);
      await page.waitForTimeout(100);
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 10 });
      await page.waitForTimeout(200);
      await page.mouse.up();
      await page.waitForTimeout(500);
      console.log('Drag and drop executed!');
    }
  }

  const sc = path.join(artifactDir, 'phase5_drag_drop_result.png');
  await page.screenshot({ path: sc, fullPage: true });
  console.log('Captured drag and drop result screenshot:', sc);

  await browser.close();
}

captureConflict().catch(console.error);
