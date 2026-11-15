import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function auditResponsiveLayouts() {
  console.log('=== STARTING CHRONOFORGE RESPONSIVE LAYOUT AUDIT ===');
  const artifactDir = 'C:\\Users\\rpnis\\.gemini\\antigravity\\brain\\41eedee0-d1fd-496f-9b8b-1ca6aa33193f';
  const screenshotDir = path.join(artifactDir, 'responsive_audit');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '320px_mobile_small', width: 320, height: 640 },
    { name: '375px_iphone_se', width: 375, height: 667 },
    { name: '390px_iphone_14', width: 390, height: 844 },
    { name: '414px_iphone_plus', width: 414, height: 896 },
    { name: '600px_foldable', width: 600, height: 800 },
    { name: '768px_ipad_portrait', width: 768, height: 1024 },
    { name: '1024px_laptop_small', width: 1024, height: 768 },
    { name: '1440px_desktop', width: 1440, height: 900 },
    { name: '2560px_ultrawide', width: 2560, height: 1440 },
    { name: 'landscape_phone', width: 844, height: 390 }
  ];

  const routes = [
    { id: 'dashboard', nav: 'dashboard', name: 'Dashboard' },
    { id: 'classes', nav: 'classes', name: 'Classes Management' },
    { id: 'staff', nav: 'staff', name: 'Staff Faculty' },
    { id: 'assignments', nav: 'assignments', name: 'Curriculum Assignment Matrix' },
    { id: 'viewer', nav: 'viewer', name: 'Timetable Viewer' },
    { id: 'generate', nav: 'generate', name: 'AI Generator' },
    { id: 'export', nav: 'export', name: 'Export Center' }
  ];

  const auditReport = [];

  for (const vp of viewports) {
    console.log(`\nAuditing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Make sure demo school is loaded so pages have full content
    const loadDemoBtn = page.locator('button', { hasText: 'Load Demo' }).first();
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(400);
    }

    for (const route of routes) {
      try {
        // Open sidebar on mobile if needed
        const mobileMenuBtn = page.locator('button[aria-label="Open navigation"], button:has(svg.lucide-menu)').first();
        if (await mobileMenuBtn.isVisible() && vp.width < 1024) {
          await mobileMenuBtn.click();
          await page.waitForTimeout(200);
        }

        const navBtn = page.locator(`button[data-nav="${route.nav}"]`).first();
        if (await navBtn.isVisible()) {
          await navBtn.click();
          await page.waitForTimeout(300);
        }

        // Check horizontal overflow
        const overflowCheck = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;
          const hasOverflow = scrollWidth > clientWidth + 1;
          const overflowingElements = [];

          if (hasOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 2) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  className: el.className ? String(el.className).slice(0, 80) : '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          return {
            scrollWidth,
            clientWidth,
            hasOverflow,
            diff: scrollWidth - clientWidth,
            overflowingElements
          };
        });

        const screenshotName = `${vp.name}_${route.id}.png`;
        const screenshotPath = path.join(screenshotDir, screenshotName);
        await page.screenshot({ path: screenshotPath });

        auditReport.push({
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          route: route.name,
          routeId: route.id,
          hasOverflow: overflowCheck.hasOverflow,
          overflowDiff: overflowCheck.diff,
          overflowingElements: overflowCheck.overflowingElements,
          screenshot: screenshotName
        });

        if (overflowCheck.hasOverflow) {
          console.log(`  [OVERFLOW] ${route.name} at ${vp.width}px: scrollWidth ${overflowCheck.scrollWidth}px vs ${overflowCheck.clientWidth}px (diff: +${overflowCheck.diff}px)`);
        } else {
          console.log(`  [OK] ${route.name} at ${vp.width}px (no body overflow)`);
        }
      } catch (e) {
        console.error(`  [ERROR] on ${route.name} at ${vp.name}:`, e.message);
      }
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.join(artifactDir, 'responsive_audit_data.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`\nAudit completed! Report saved to ${reportPath}`);
}

auditResponsiveLayouts();
