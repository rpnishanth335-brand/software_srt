import { chromium } from 'playwright';
import path from 'path';

async function capture() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture Main Cards Showcase
  const screenshot1 = path.join(artifactDir, 'phase1_cards_showcase.png');
  await page.screenshot({ path: screenshot1, fullPage: true });
  console.log('Saved cards showcase screenshot:', screenshot1);

  // 2. Click Buttons Tab
  const buttonsTab = page.locator('button', { hasText: 'Molten Buttons' });
  await buttonsTab.click();
  await page.waitForTimeout(500);
  const screenshot2 = path.join(artifactDir, 'phase1_buttons_showcase.png');
  await page.screenshot({ path: screenshot2, fullPage: true });
  console.log('Saved buttons showcase screenshot:', screenshot2);

  // 3. Click Goo Droplet Merging Tab
  const gooTab = page.locator('button', { hasText: 'Molten Droplet Merging' });
  await gooTab.click();
  await page.waitForTimeout(500);

  // Click Step 03 chip
  const step3 = page.locator('button', { hasText: 'Step 03' });
  await step3.click();
  await page.waitForTimeout(500);
  const screenshot3 = path.join(artifactDir, 'phase1_goo_showcase.png');
  await page.screenshot({ path: screenshot3, fullPage: true });
  console.log('Saved goo showcase screenshot:', screenshot3);

  // 4. Switch to Timetable Wizard View
  const wizardBtn = page.locator('button', { hasText: 'Timetable Wizard' });
  await wizardBtn.click();
  await page.waitForTimeout(500);
  const screenshot4 = path.join(artifactDir, 'phase1_wizard_launcher.png');
  await page.screenshot({ path: screenshot4, fullPage: true });
  console.log('Saved wizard launcher screenshot:', screenshot4);

  await browser.close();
  console.log('Capture completed successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
