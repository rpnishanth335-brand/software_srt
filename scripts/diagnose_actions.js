import { chromium } from 'playwright';

async function diagnose() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('--- TEST 1: Reset to empty state ---');
  await page.locator('button', { hasText: 'Reset' }).click();
  await page.waitForTimeout(600);

  // Check state on Step 1 (School Basics)
  console.log('--- TEST 2: Step 1 School Basics ---');
  const schoolNameInput = page.locator('input[placeholder*="Greenwood"], input[value="New School"], input[type="text"]').first();
  console.log('School name input value:', await schoolNameInput.inputValue());
  await schoolNameInput.fill('Apex Global School');
  await page.waitForTimeout(400);

  // Navigate to Step 2 (Classes)
  console.log('--- TEST 3: Step 2 Adding a Class ---');
  await page.locator('button', { hasText: 'Classes' }).first().click();
  await page.waitForTimeout(500);

  const classCountBefore = await page.locator('text=Active, text=Excluded').count();
  console.log('Initial class cards count:', classCountBefore);

  const classNameInput = page.locator('input[placeholder*="Class Name"]');
  const sectionInput = page.locator('input[placeholder*="Section"]');
  const roomInput = page.locator('input[placeholder*="Room"]');

  console.log('Typing new class: Grade 11 - A - Room 501');
  await classNameInput.fill('Grade 11');
  await sectionInput.fill('A');
  await roomInput.fill('Room 501');

  const addClassBtn = page.locator('button', { hasText: 'Add Class' });
  console.log('Clicking Add Class button...');
  await addClassBtn.click();
  await page.waitForTimeout(600);

  const classCardsAfter = await page.locator('text=Grade 11 – A').count();
  console.log('Count of Grade 11 – A cards:', classCardsAfter);

  // Test Quick Generator
  console.log('--- TEST 4: Batch Class Generator ---');
  const quickGenBtn = page.locator('button', { hasText: 'Quick Generator' });
  await quickGenBtn.click();
  await page.waitForTimeout(300);

  const genClassesBtn = page.locator('button', { hasText: 'Generate Classes' });
  console.log('Clicking Generate Classes...');
  await genClassesBtn.click();
  await page.waitForTimeout(600);
  const totalClassesAfterGen = await page.locator('button:has-text("Grade")').count();
  console.log('Total class items after quick generator:', totalClassesAfterGen);

  // Navigate to Step 3 (Subjects)
  console.log('--- TEST 5: Step 3 Adding a Subject ---');
  await page.locator('button', { hasText: 'Subjects' }).first().click();
  await page.waitForTimeout(500);

  const subNameInput = page.locator('input[placeholder*="Mathematics"], input[placeholder*="Subject Name"]').first();
  const subCodeInput = page.locator('input[placeholder*="MATH"], input[placeholder*="Code"]').first();

  console.log('Typing new subject: Robotics / ROB');
  await subNameInput.fill('Robotics');
  await subCodeInput.fill('ROB');

  const addSubBtn = page.locator('button', { hasText: 'Add Subject' });
  await addSubBtn.click();
  await page.waitForTimeout(600);

  const robCards = await page.locator('text=Robotics').count();
  console.log('Count of Robotics subject cards:', robCards);

  // Navigate to Step 4 (Staff)
  console.log('--- TEST 6: Step 4 Adding Staff (Teachers) ---');
  await page.locator('button', { hasText: 'Staff' }).first().click();
  await page.waitForTimeout(500);

  const teacherNameInput = page.locator('input[placeholder*="Dr. Alan Turing"], input[placeholder*="Teacher Name"]').first();
  const teacherCodeInput = page.locator('input[placeholder*="AT"], input[placeholder*="Short Code"]').first();

  console.log('Typing new staff: Alan Turing / AT');
  await teacherNameInput.fill('Alan Turing');
  await teacherCodeInput.fill('AT');

  // Select a subject for the teacher
  const subjectChips = page.locator('button:has-text("ROB"), button:has-text("Theory"), button:has-text("Robotics")');
  if (await subjectChips.count() > 0) {
    await subjectChips.first().click();
    console.log('Selected subject chip for teacher');
  }

  const addStaffBtn = page.locator('button', { hasText: 'Add Faculty Member' });
  console.log('Clicking Add Faculty Member...');
  await addStaffBtn.click();
  await page.waitForTimeout(600);

  const staffCards = await page.locator('text=Alan Turing').count();
  console.log('Count of Alan Turing staff cards:', staffCards);

  // Check reload persistence
  console.log('--- TEST 7: Page Reload Persistence ---');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check if Grade 11 is still there
  await page.locator('button', { hasText: 'Classes' }).first().click();
  await page.waitForTimeout(500);
  const reloadedClassCount = await page.locator('text=Grade 11 – A').count();
  console.log('Grade 11 – A count after reload:', reloadedClassCount);

  console.log('--- CONSOLE LOGS & ERRORS: ---');
  logs.forEach(l => console.log(l));

  await browser.close();
}

diagnose().catch(err => {
  console.error('Diagnosis script failed:', err);
  process.exit(1);
});
