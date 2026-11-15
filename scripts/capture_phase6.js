import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function capturePhase6() {
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const downloadDir = path.join(artifactDir, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Load demo school
  console.log('Loading demo school...');
  await page.locator('button', { hasText: 'Load Demo School' }).click();
  await page.waitForTimeout(600);

  // Forge timetable
  console.log('Navigating to Step 8 (Generate)...');
  await page.locator('button', { hasText: 'Generate' }).click();
  await page.waitForTimeout(600);

  console.log('Forging timetable...');
  await page.locator('button', { hasText: 'FORGE FULL TIMETABLE' }).click();
  const viewWorkspaceBtn = page.locator('button', { hasText: 'View Timetable Workspace' });
  await viewWorkspaceBtn.waitFor({ state: 'visible', timeout: 15000 });

  // Navigate to Step 10 (Export System)
  console.log('Navigating to Step 10 (Export System)...');
  await page.locator('button', { hasText: 'Export' }).click();
  await page.waitForTimeout(800);

  // 1. Capture Step 10 Export Center Interface
  const sc1 = path.join(artifactDir, 'phase6_export_center.png');
  await page.screenshot({ path: sc1, fullPage: true });
  console.log('Captured Export Center Interface:', sc1);

  // 2. Test PDF Download
  console.log('Testing PDF Export...');
  const [pdfDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('button', { hasText: 'Download PDF Document' }).click(),
  ]);
  const pdfPath = path.join(downloadDir, pdfDownload.suggestedFilename());
  await pdfDownload.saveAs(pdfPath);
  console.log(`Saved PDF to: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);

  await page.waitForTimeout(500);

  // 3. Test Excel (.xlsx) Download
  console.log('Testing Excel Export...');
  const [excelDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('button', { hasText: 'Download Multi-Sheet Excel' }).click(),
  ]);
  const excelPath = path.join(downloadDir, excelDownload.suggestedFilename());
  await excelDownload.saveAs(excelPath);
  console.log(`Saved Excel to: ${excelPath} (${fs.statSync(excelPath).size} bytes)`);

  await page.waitForTimeout(500);

  // 4. Test CSV Download
  console.log('Testing CSV Export...');
  const [csvDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('button', { hasText: 'Download CSV Dataset' }).click(),
  ]);
  const csvPath = path.join(downloadDir, csvDownload.suggestedFilename());
  await csvDownload.saveAs(csvPath);
  console.log(`Saved CSV to: ${csvPath} (${fs.statSync(csvPath).size} bytes)`);

  await page.waitForTimeout(500);

  // 5. Test JSON Backup Download
  console.log('Testing JSON Backup Export...');
  const [jsonDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.locator('button', { hasText: 'Export Complete Backup' }).click(),
  ]);
  const jsonPath = path.join(downloadDir, jsonDownload.suggestedFilename());
  await jsonDownload.saveAs(jsonPath);
  console.log(`Saved JSON Backup to: ${jsonPath} (${fs.statSync(jsonPath).size} bytes)`);

  await page.waitForTimeout(600);

  // Capture final screen showing success banner
  const sc2 = path.join(artifactDir, 'phase6_export_success.png');
  await page.screenshot({ path: sc2, fullPage: true });
  console.log('Captured Export Success State:', sc2);

  await browser.close();
  console.log('Phase 6 verification script finished with 100% success!');
}

capturePhase6().catch((err) => {
  console.error('Phase 6 verification error:', err);
  process.exit(1);
});
