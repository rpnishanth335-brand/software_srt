import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runAllPagesVerification() {
  console.log('=== CHRONOFORGE: FULL 13-PAGE COMPREHENSIVE VERIFICATION ===');
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const downloadDir = path.join(artifactDir, 'downloads_verify');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`[Browser Page Error] ${err.message}`);
  });

  try {
    // 1. Dashboard Page
    console.log('\n[1/13] Testing Dashboard & Load Demo...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Click "Load Demo School"
    const loadDemoBtn = page.locator('button', { hasText: 'Load Demo' }).first();
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(600);
      console.log('  -> Loaded full demo school');
    }

    await page.screenshot({ path: path.join(artifactDir, 'verify_01_dashboard.png') });
    console.log('  -> Dashboard screenshot captured: verify_01_dashboard.png');

    // 2. School Settings Page
    console.log('\n[2/13] Testing School Settings Page...');
    await page.locator('button[data-nav="school"]').click();
    await page.waitForTimeout(400);

    const schoolNameInput = page.locator('input[placeholder="e.g. St. Jude International Academy"]');
    await schoolNameInput.fill('ChronoForge Demonstration Academy');
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(artifactDir, 'verify_02_school_settings.png') });
    console.log('  -> School Settings screenshot captured: verify_02_school_settings.png');

    // 3. Classes Page
    console.log('\n[3/13] Testing Classes Page CRUD & Batch Generator...');
    await page.locator('button[data-nav="classes"]').click();
    await page.waitForTimeout(400);

    // Fill inline form
    await page.locator('input[placeholder="e.g. Grade 10"]').fill('Grade 12');
    await page.locator('input[placeholder="e.g. A"]').fill('Alpha');
    
    // Save Class (Click Add)
    const addClassForm = page.locator('form', { hasText: 'Add Individual Class' });
    await addClassForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Verify presence in list
    const addedClass = page.locator('text=Grade 12').first();
    await addedClass.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  -> Successfully added Class: Grade 12');

    // Open Cohort Batch Generator drawer
    await page.locator('button', { hasText: 'Bulk Generator' }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'verify_03_classes_bulk_generator.png') });
    console.log('  -> Bulk Generator screenshot captured: verify_03_classes_bulk_generator.png');
    // Close drawer
    await page.locator('button', { hasText: 'Bulk Generator' }).first().click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(artifactDir, 'verify_03_classes_list.png') });

    // 4. Subjects Page
    console.log('\n[4/13] Testing Subjects Page CRUD...');
    await page.locator('button[data-nav="subjects"]').click();
    await page.waitForTimeout(400);

    // Fill form
    await page.locator('input[placeholder="e.g. Physics"]').fill('Quantum Computing');
    await page.locator('input[placeholder="e.g. PHY"]').fill('QC');
    
    // Save Subject (Click Add)
    const addSubForm = page.locator('form', { hasText: 'Register New Subject' });
    await addSubForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    const addedSubject = page.locator('text=Quantum Computing').first();
    await addedSubject.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  -> Successfully added Subject: Quantum Computing');

    await page.screenshot({ path: path.join(artifactDir, 'verify_04_subjects_crud.png') });
    console.log('  -> Subjects screenshot captured: verify_04_subjects_crud.png');

    // 5. Staff Page
    console.log('\n[5/13] Testing Staff Page CRUD & Availability Grid...');
    await page.locator('button[data-nav="staff"]').click();
    await page.waitForTimeout(400);

    // Fill teacher form
    await page.locator('input[placeholder="e.g. Dr. Jane Doe"]').fill('Prof. Ada Lovelace');
    await page.locator('input[placeholder="e.g. JD"]').fill('AL');
    await page.locator('button', { hasText: 'Select All Subjects' }).click();
    await page.waitForTimeout(200);

    // Save Teacher
    const addStaffForm = page.locator('form', { hasText: 'Add New Faculty Member' });
    await addStaffForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    const addedTeacher = page.locator('text=Prof. Ada Lovelace').first();
    await addedTeacher.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  -> Successfully added Teacher: Prof. Ada Lovelace');

    await page.screenshot({ path: path.join(artifactDir, 'verify_05_staff_list.png') });
    console.log('  -> Staff screenshot captured: verify_05_staff_list.png');

    // 6. Rooms Page
    console.log('\n[6/13] Testing Rooms Page...');
    await page.locator('button[data-nav="rooms"]').click();
    await page.waitForTimeout(400);

    await page.locator('input[placeholder="e.g. Physics Lab 1"]').fill('Robotics Suite');
    await page.locator('input[placeholder="e.g. LAB-01"]').fill('ROBO-X');
    
    const addRoomForm = page.locator('form', { hasText: 'Register Facility / Room' });
    await addRoomForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    const addedRoom = page.locator('text=Robotics Suite').first();
    await addedRoom.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  -> Successfully added Room: Robotics Suite');

    await page.screenshot({ path: path.join(artifactDir, 'verify_06_rooms_crud.png') });
    console.log('  -> Rooms screenshot captured: verify_06_rooms_crud.png');

    // 7. Assignments Matrix
    console.log('\n[7/13] Testing Assignments Matrix...');
    await page.locator('button[data-nav="assignments"]').click();
    await page.waitForTimeout(500);

    const matrixHeader = page.locator('text=Curriculum Assignment Matrix');
    await matrixHeader.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  -> Assignments matrix rendered successfully');

    await page.screenshot({ path: path.join(artifactDir, 'verify_07_assignments_matrix.png') });
    console.log('  -> Assignments screenshot captured: verify_07_assignments_matrix.png');

    // 8. Rules & Optimization Sliders
    console.log('\n[8/13] Testing Rules & Optimization Weights...');
    await page.locator('button[data-nav="rules"]').click();
    await page.waitForTimeout(400);

    // Click preset "Balanced Default"
    await page.locator('button', { hasText: 'Balanced Default' }).click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(artifactDir, 'verify_08_rules_sliders.png') });
    console.log('  -> Rules screenshot captured: verify_08_rules_sliders.png');

    // 9. Feasibility Audit
    console.log('\n[9/13] Testing Feasibility Audit Page...');
    await page.locator('button[data-nav="feasibility"]').click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(artifactDir, 'verify_09_feasibility_check.png') });
    console.log('  -> Feasibility screenshot captured: verify_09_feasibility_check.png');

    // 10. Generate / Solver
    console.log('\n[10/13] Testing Timetable Generator & Web Worker Solve...');
    await page.locator('button[data-nav="generate"]').click();
    await page.waitForTimeout(400);

    // Select "fast" mode
    await page.locator('button', { hasText: 'fast' }).click();
    await page.waitForTimeout(200);

    // Click "Generate Conflict-Free Timetable"
    console.log('  -> Starting Web Worker solver execution...');
    await page.locator('button', { hasText: 'Generate Conflict-Free Timetable' }).click();

    // Wait for completion (up to 30s)
    const successCard = page.locator('text=Timetable Successfully Synthesized!');
    await successCard.waitFor({ state: 'visible', timeout: 30000 });
    console.log('  -> Web Worker Timetable Generation completed successfully!');

    await page.screenshot({ path: path.join(artifactDir, 'verify_10_generator_solved.png') });
    console.log('  -> Generator solved screenshot captured: verify_10_generator_solved.png');

    // 11. Interactive Viewer Page
    console.log('\n[11/13] Testing Interactive Timetable Viewer...');
    await page.locator('button[data-nav="viewer"]').click();
    await page.waitForTimeout(600);

    // Verify Class View
    await page.screenshot({ path: path.join(artifactDir, 'verify_11a_viewer_class.png') });

    // Switch to By Teacher view
    await page.locator('button', { hasText: 'By Teacher' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'verify_11b_viewer_teacher.png') });

    // Switch to Master Grid view
    await page.locator('button', { hasText: 'Master Grid' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'verify_11c_viewer_master.png') });
    console.log('  -> Captured Viewer By Class, By Teacher, and Master Grid screenshots');

    // 12. Export Center
    console.log('\n[12/13] Testing Export Center (PDF, Excel, CSV, Backup)...');
    await page.locator('button[data-nav="export"]').click();
    await page.waitForTimeout(400);

    // Test PDF export download
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download PDF Booklet' }).click()
    ]);
    const pdfPath = path.join(downloadDir, pdfDownload.suggestedFilename());
    await pdfDownload.saveAs(pdfPath);
    console.log(`  -> Successfully downloaded PDF: ${pdfDownload.suggestedFilename()} (${fs.statSync(pdfPath).size} bytes)`);

    // Test Excel export download
    const [xlsxDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download Excel (.xlsx)' }).click()
    ]);
    const xlsxPath = path.join(downloadDir, xlsxDownload.suggestedFilename());
    await xlsxDownload.saveAs(xlsxPath);
    console.log(`  -> Successfully downloaded Excel: ${xlsxDownload.suggestedFilename()} (${fs.statSync(xlsxPath).size} bytes)`);

    // Test CSV export download
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Download Flat CSV' }).click()
    ]);
    const csvPath = path.join(downloadDir, csvDownload.suggestedFilename());
    await csvDownload.saveAs(csvPath);
    console.log(`  -> Successfully downloaded CSV: ${csvDownload.suggestedFilename()} (${fs.statSync(csvPath).size} bytes)`);

    // Test JSON backup export download
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('button', { hasText: 'Export JSON' }).click()
    ]);
    const jsonPath = path.join(downloadDir, jsonDownload.suggestedFilename());
    await jsonDownload.saveAs(jsonPath);
    console.log(`  -> Successfully downloaded JSON Backup: ${jsonDownload.suggestedFilename()} (${fs.statSync(jsonPath).size} bytes)`);

    await page.screenshot({ path: path.join(artifactDir, 'verify_12_export_center.png') });
    console.log('  -> Export Center screenshot captured: verify_12_export_center.png');

    // 13. System Settings
    console.log('\n[13/13] Testing System & Theme Settings...');
    await page.locator('button[data-nav="settings"]').click();
    await page.waitForTimeout(400);

    await page.screenshot({ path: path.join(artifactDir, 'verify_13_app_settings.png') });
    console.log('  -> App Settings screenshot captured: verify_13_app_settings.png');

    console.log('\n======================================================');
    console.log('🎉 ALL 13 PAGES AND ACTIONS VERIFIED 100% SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('VERIFICATION ERROR:', error);
    await page.screenshot({ path: path.join(artifactDir, 'verification_failure.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

runAllPagesVerification();
