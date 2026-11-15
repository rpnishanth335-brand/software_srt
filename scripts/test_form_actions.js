import { chromium } from 'playwright';

async function diagnoseAll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  const issues = [];

  page.on('console', msg => {
    if (msg.type() === 'error') issues.push({ type: 'CONSOLE_ERROR', text: msg.text() });
  });
  page.on('pageerror', err => {
    issues.push({ type: 'PAGE_ERROR', text: err.toString() });
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 1. Test Reset
  console.log('Testing Reset...');
  await page.locator('button', { hasText: 'Reset' }).click();
  await page.waitForTimeout(500);

  // 2. Test Step 2 Classes Form
  console.log('Testing Step 2 Classes...');
  const stepButtons = page.locator('div.w-full.overflow-x-auto button');
  await stepButtons.nth(1).click();
  await page.waitForTimeout(400);

  // Try submitting empty class form
  const addClassBtn = page.locator('form button', { hasText: 'Add Class' });
  await addClassBtn.click();
  await page.waitForTimeout(200);
  // Did it show validation error?
  const hasValidationError = await page.locator('text=required, text=Please enter').count();
  if (hasValidationError === 0) {
    issues.push({
      page: 'Classes (Step 2)',
      button: 'Add Class',
      expected: 'Visible validation error when submitting empty form',
      actual: 'Silent return without feedback (Checklist #3)',
    });
  }

  // Fill and submit valid class
  await page.locator('input[placeholder*="Class Name"]').fill('Grade 12');
  await page.locator('input[placeholder*="Section"]').fill('B');
  await page.locator('input[placeholder="Room (e.g. Room 401)"]').fill('Room 602');
  await addClassBtn.click();
  await page.waitForTimeout(400);
  const classCreated = await page.locator('text=Grade 12 – B').count() > 0;
  console.log('Grade 12 - B created:', classCreated);

  // 3. Test Step 3 Subjects Form
  console.log('Testing Step 3 Subjects...');
  await stepButtons.nth(2).click();
  await page.waitForTimeout(400);

  // Try submitting empty subject form
  const addSubBtn = page.locator('form button', { hasText: 'Add Subject' });
  await addSubBtn.click();
  await page.waitForTimeout(200);
  if (await page.locator('text=required, text=Please enter').count() === 0) {
    issues.push({
      page: 'Subjects (Step 3)',
      button: 'Add Subject',
      expected: 'Visible validation error when required fields are missing',
      actual: 'Silent return with no user feedback (Checklist #3)',
    });
  }

  // 4. Test Step 4 Staff Form
  console.log('Testing Step 4 Staff...');
  await stepButtons.nth(3).click();
  await page.waitForTimeout(400);

  // Fill name and code without selecting subject
  await page.locator('input[placeholder*="Teacher Name"], input[placeholder*="Dr. Alan"]').first().fill('Marie Curie');
  await page.locator('input[placeholder*="Short Code"], input[placeholder*="AT"]').first().fill('MC');
  const addStaffBtn = page.locator('form button', { hasText: 'Add Faculty Member' });
  await addStaffBtn.click();
  await page.waitForTimeout(300);

  const teacherCreatedWithoutSubject = await page.locator('text=Marie Curie').count() > 0;
  if (!teacherCreatedWithoutSubject) {
    issues.push({
      page: 'Staff (Step 4)',
      button: 'Add Faculty Member',
      expected: 'Inform user that at least one subject must be selected or allow saving general staff',
      actual: 'Button clicked, animated, but silently did nothing (Checklist #3: silent rejection without validation error)',
    });
  }

  // 5. Test Step 1 School Basics Working Days & Periods
  console.log('Testing Step 1 School Basics...');
  await stepButtons.nth(0).click();
  await page.waitForTimeout(400);

  // Check if there is an explicit Rooms page
  const roomPageExists = await page.locator('text=Rooms and Resources, text=Rooms & Labs').count() > 0;
  if (!roomPageExists) {
    issues.push({
      page: 'Rooms and Resources',
      button: 'Navigation',
      expected: 'Dedicated Rooms and Resources management page as required by Section 4.6',
      actual: 'Missing completely from navigation (Checklist #6: routes not registered / pages missing)',
    });
  }

  // Check if Dashboard exists
  const dashboardExists = await page.locator('text=Dashboard, text=Setup completeness').count() > 0;
  if (!dashboardExists) {
    issues.push({
      page: 'Dashboard',
      button: 'Navigation',
      expected: 'Sidebar layout with Dashboard & Setup completeness indicator as required by Section 4.1',
      actual: 'Missing completely; app is locked into a linear 10-step wizard only (Checklist #6)',
    });
  }

  // Check if Settings page exists
  const settingsPageExists = await page.locator('text=App Settings, text=Reset all data').count() > 0;
  if (!settingsPageExists) {
    issues.push({
      page: 'Settings',
      button: 'Navigation',
      expected: 'Dedicated Settings page with Theme, Quality, Language, and Reset with double confirmation (Section 4.13)',
      actual: 'Missing dedicated Settings page; only partial options in Navbar and AI modal (Checklist #6)',
    });
  }

  console.log('=== DIAGNOSED ISSUES ===');
  console.log(JSON.stringify(issues, null, 2));

  await browser.close();
}

diagnoseAll().catch(err => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});
