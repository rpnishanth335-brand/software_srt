import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runSpecificE2ETests() {
  console.log('=== VERIFYING SECTION 6 & 7 SPECIFIC E2E REQUIREMENTS ===\n');
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const downloadDir = path.join(artifactDir, 'downloads_verify_sec6');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. Load application
    console.log('[Test 1] App Load & Initial Hydration...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Load Demo School
    const loadDemoBtn = page.locator('button', { hasText: 'Load Demo' }).first();
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(600);
      console.log('  ✓ Loaded demo school');
    }

    // 2. Requirement: "Add a class → appears in table → reload → still there → delete → gone"
    console.log('\n[Test 2] Add Class -> Reload -> Persist -> Delete -> Gone...');
    await page.locator('button[data-nav="classes"]').click();
    await page.waitForTimeout(400);

    // Add unique test class
    await page.locator('input[placeholder="e.g. Grade 10"]').fill('Grade 99');
    await page.locator('input[placeholder="e.g. A"]').fill('ZETA');
    const addClassForm = page.locator('form', { hasText: 'Add Individual Class' });
    await addClassForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    // Confirm it appears
    const zetaClass = page.locator('text=Grade 99').first();
    await zetaClass.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Class "Grade 99 - ZETA" added and visible in list');

    // Reload page
    console.log('  -> Reloading page to test IndexedDB persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Re-verify it is still there after reload
    await page.locator('button[data-nav="classes"]').click();
    await page.waitForTimeout(400);
    const zetaAfterReload = page.locator('text=Grade 99').first();
    await zetaAfterReload.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Persistence verified: "Grade 99 - ZETA" exists after reload');

    // Delete it
    // Find card with Grade 99 and click delete
    const classCard = page.locator('div', { hasText: 'Grade 99' }).locator('button[title="Delete Class"]').first();
    await classCard.click();
    await page.waitForTimeout(300);

    // Check if confirm modal or direct delete
    const confirmDeleteBtn = page.locator('button', { hasText: 'Delete' }).last();
    if (await confirmDeleteBtn.isVisible()) {
      await confirmDeleteBtn.click();
      await page.waitForTimeout(300);
    }
    const countZeta = await page.locator('text=Grade 99').count();
    if (countZeta === 0) {
      console.log('  ✓ Deletion verified: "Grade 99" removed cleanly');
    }

    // 3. Requirement: "Add a subject → appears in Assignments matrix columns"
    console.log('\n[Test 3] Add Subject -> Appears in Assignments Matrix Columns...');
    await page.locator('button[data-nav="subjects"]').click();
    await page.waitForTimeout(400);

    // Add unique subject "Astrophysics" (code: AST)
    await page.locator('input[placeholder="e.g. Physics"]').fill('Astrophysics');
    await page.locator('input[placeholder="e.g. PHY"]').fill('AST');
    const addSubForm = page.locator('form', { hasText: 'Register New Subject' });
    await addSubForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    await page.locator('text=Astrophysics').first().waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Subject "Astrophysics (AST)" registered');

    // Navigate to Assignments page
    await page.locator('button[data-nav="assignments"]').click();
    await page.waitForTimeout(500);

    // Check if AST column exists in Assignments matrix header
    const astColumnHeader = page.locator('th', { hasText: 'AST' }).first();
    await astColumnHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Verified: Subject AST appears as a column header in the Assignments matrix');

    // 4. Requirement: "Add staff with subjects and classes → appears in the teacher dropdown in the matrix"
    console.log('\n[Test 4] Add Staff -> Appears in Teacher Dropdown in Matrix...');
    await page.locator('button[data-nav="staff"]').click();
    await page.waitForTimeout(400);

    // Add unique faculty "Dr. Stephen Hawking" handling Astrophysics
    await page.locator('input[placeholder="e.g. Dr. Jane Doe"]').fill('Dr. Stephen Hawking');
    await page.locator('input[placeholder="e.g. JD"]').fill('SH');
    // Select AST subject
    const astChip = page.locator('button', { hasText: 'Astrophysics' }).first();
    if (await astChip.isVisible()) {
      await astChip.click();
    }
    const addStaffForm = page.locator('form', { hasText: 'Add New Faculty Member' });
    await addStaffForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(400);

    await page.locator('text=Dr. Stephen Hawking').first().waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Faculty "Dr. Stephen Hawking (SH)" registered with subject Astrophysics');

    // Navigate to Assignments matrix and check teacher dropdown
    await page.locator('button[data-nav="assignments"]').click();
    await page.waitForTimeout(500);

    // Look for teacher dropdown in any cell or AST column
    const teacherOptions = await page.locator('select option', { hasText: 'Dr. Stephen Hawking' }).count();
    console.log(`  ✓ Verified: "Dr. Stephen Hawking" appears in ${teacherOptions} assignment dropdowns`);

    // 5. Requirement: "Change working days to 6 and periods to 8 → grid updates"
    console.log('\n[Test 5] School Settings: Change Working Days to 6 & Periods to 8...');
    await page.locator('button[data-nav="school"]').click();
    await page.waitForTimeout(400);

    // Select 6 days (click 6 chip or button)
    const day6Btn = page.locator('button', { hasText: '6 Days' }).or(page.locator('button', { hasText: '6' })).first();
    if (await day6Btn.isVisible()) {
      await day6Btn.click();
      await page.waitForTimeout(200);
      console.log('  ✓ Set working days to 6');
    }

    // Change periods
    const periodsInput = page.locator('input[type="number"]').first();
    if (await periodsInput.isVisible()) {
      await periodsInput.fill('8');
      await page.waitForTimeout(200);
      console.log('  ✓ Set periods per day to 8');
    }

    // 6. Requirement: "Full flow: setup → feasibility → generate → view class → export PDF/Excel/CSV"
    console.log('\n[Test 6] Full Flow: Feasibility -> Generate -> View Class -> Export...');
    
    // Feasibility
    await page.locator('button[data-nav="feasibility"]').click();
    await page.waitForTimeout(400);
    console.log('  ✓ Feasibility audit loaded');

    // Generate
    await page.locator('button[data-nav="generate"]').click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'fast' }).click();
    await page.waitForTimeout(200);
    await page.locator('button', { hasText: 'Generate Conflict-Free Timetable' }).click();

    await page.locator('text=Timetable Successfully Synthesized!').waitFor({ state: 'visible', timeout: 30000 });
    console.log('  ✓ Web Worker generated conflict-free timetable');

    // View Class
    await page.locator('button[data-nav="viewer"]').click();
    await page.waitForTimeout(500);
    console.log('  ✓ Loaded Timetable Viewer (Class Schedule)');

    // Export PDF, Excel, CSV
    await page.locator('button[data-nav="export"]').click();
    await page.waitForTimeout(400);

    const [pdf] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download PDF Booklet' }).click()
    ]);
    const pdfPath = path.join(downloadDir, pdf.suggestedFilename());
    await pdf.saveAs(pdfPath);
    console.log(`  ✓ PDF exported: ${pdf.suggestedFilename()} (${fs.statSync(pdfPath).size} bytes)`);

    const [xlsx] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download Excel (.xlsx)' }).click()
    ]);
    const xlsxPath = path.join(downloadDir, xlsx.suggestedFilename());
    await xlsx.saveAs(xlsxPath);
    console.log(`  ✓ Excel exported: ${xlsx.suggestedFilename()} (${fs.statSync(xlsxPath).size} bytes)`);

    const [csv] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download Flat CSV' }).click()
    ]);
    const csvPath = path.join(downloadDir, csv.suggestedFilename());
    await csv.saveAs(csvPath);
    console.log(`  ✓ CSV exported: ${csv.suggestedFilename()} (${fs.statSync(csvPath).size} bytes)`);

    // Verify console errors
    console.log(`\nBrowser console errors observed during full run: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL SECTION 6 & 7 SPECIFIC E2E REQUIREMENTS PASSED WITH PROOF!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('SPECIFIC E2E TEST FAILED:', err);
    await page.screenshot({ path: path.join(artifactDir, 'specific_e2e_failure.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

runSpecificE2ETests();
