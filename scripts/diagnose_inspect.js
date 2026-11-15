import { chromium } from 'playwright';

async function diagnoseInspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.waitForTimeout(600);

  const stepButtons = page.locator('div.w-full.overflow-x-auto button');
  await stepButtons.nth(3).click();
  await page.waitForTimeout(500);

  const subBtns = page.locator('form div:has-text("Subjects Taught") button');
  const count = await subBtns.count();
  console.log(`Found ${count} subject buttons inside form.`);
  for (let i = 0; i < Math.min(count, 5); i++) {
    console.log(`Subject button ${i}: "${await subBtns.nth(i).innerText()}"`);
  }

  // Type teacher name and code
  await page.locator('input[placeholder*="Arthur Pendelton"]').fill('Dr. Isaac Newton');
  await page.locator('input[placeholder*="AP"]').fill('IN');

  // Click first subject button
  console.log('Clicking first subject button...');
  await subBtns.first().click();
  await page.waitForTimeout(300);

  // Check class of button to see if isSelected applied
  const subBtnClass = await subBtns.first().getAttribute('class');
  console.log('Subject button class after click:', subBtnClass);

  // Click Add Teacher
  const addBtn = page.locator('form button', { hasText: 'Add Teacher' });
  console.log('Clicking Add Teacher button...');
  await addBtn.click();
  await page.waitForTimeout(500);

  const isCreated = await page.locator('text=Dr. Isaac Newton').count() > 0;
  console.log('Is Dr. Isaac Newton in DOM?:', isCreated);

  await browser.close();
}

diagnoseInspect().catch(console.error);
