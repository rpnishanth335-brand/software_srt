import { chromium } from 'playwright';

async function diagnoseReal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.waitForTimeout(600);

  // Navigate to Step 4 Staff
  const stepButtons = page.locator('div.w-full.overflow-x-auto button');
  await stepButtons.nth(3).click();
  await page.waitForTimeout(500);

  const teacherInput = page.locator('input[placeholder*="Arthur Pendelton"]');
  const codeInput = page.locator('input[placeholder*="AP"]');
  await teacherInput.fill('Dr. Isaac Newton');
  await codeInput.fill('IN');

  const addBtn = page.locator('form button', { hasText: 'Add Teacher' });
  console.log('1. Clicking Add Teacher WITHOUT selecting subject...');
  await addBtn.click();
  await page.waitForTimeout(400);

  const created1 = await page.locator('text=Dr. Isaac Newton').count();
  console.log('Result 1 (without subject):', created1 > 0 ? 'CREATED' : 'NOT CREATED (SILENT RETURN)');

  console.log('2. Selecting subject chip...');
  const subBtn = page.locator('div:has-text("Subjects Taught") button').first();
  await subBtn.click();
  await page.waitForTimeout(200);

  console.log('3. Clicking Add Teacher WITH subject selected...');
  await addBtn.click();
  await page.waitForTimeout(400);

  const created2 = await page.locator('text=Dr. Isaac Newton').count();
  console.log('Result 2 (with subject):', created2 > 0 ? 'CREATED' : 'NOT CREATED');

  await browser.close();
}

diagnoseReal().catch(console.error);
