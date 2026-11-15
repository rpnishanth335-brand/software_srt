import { chromium } from 'playwright';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Load demo school so subjects and classes exist
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.waitForTimeout(600);

  // Navigate to Step 4 Staff
  const stepButtons = page.locator('div.w-full.overflow-x-auto button');
  await stepButtons.nth(3).click();
  await page.waitForTimeout(500);

  const teacherInput = page.locator('input[placeholder*="Arthur Pendelton"]');
  const codeInput = page.locator('input[placeholder*="AP"]');
  console.log('Teacher name input visible:', await teacherInput.isVisible());

  await teacherInput.fill('Dr. Isaac Newton');
  await codeInput.fill('IN');

  // Try to submit without clicking any subject
  const addBtn = page.locator('button', { hasText: 'Add Faculty Member' });
  await addBtn.click();
  await page.waitForTimeout(400);

  const newTeacherExists = await page.locator('text=Dr. Isaac Newton').count() > 0;
  console.log('Teacher created WITHOUT selecting subject (should be false due to silent return):', newTeacherExists);

  // Now select a subject chip (e.g. Physics)
  const phyChip = page.locator('button', { hasText: 'Physics' }).first();
  await phyChip.click();
  await page.waitForTimeout(200);

  // Submit with subject selected
  await addBtn.click();
  await page.waitForTimeout(400);

  const newTeacherWithSubjectExists = await page.locator('text=Dr. Isaac Newton').count() > 0;
  console.log('Teacher created WITH subject selected:', newTeacherWithSubjectExists);

  await browser.close();
}

diagnose().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
