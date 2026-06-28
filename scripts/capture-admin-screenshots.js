// Admin portal screenshot capture
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8088';
const OUT_DIR = path.join(__dirname, '..', 'public', 'guide', 'screenshots');

async function shot(page, name, waitMs = 1000) {
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.jpg`), fullPage: false, type: 'jpeg', quality: 88 });
  console.log(`✓ ${name}.jpg`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 820 } });
  const page = await context.newPage();

  // Login as super admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@tekhuna.com');
  await page.fill('input[type="password"]', 'SuperAdmin@2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15000 });

  // Admin overview / tenants tab
  await shot(page, '33-admin-tenants', 1500);

  // Plans tab
  await page.click('button:has-text("Plans")', { timeout: 5000 }).catch(() => page.click('[role="tab"]:has-text("Plans")').catch(() => {}));
  await shot(page, '34-admin-plans', 1200);

  // Access codes tab
  await page.click('button:has-text("Access Codes")', { timeout: 5000 }).catch(() => page.click('[role="tab"]:has-text("Access Codes")').catch(() => {}));
  await shot(page, '35-admin-access-codes', 1200);

  // Generate access code modal
  await page.click('button:has-text("Generate Code")', { timeout: 5000 }).catch(() => page.click('button:has-text("Generate")').catch(() => {}));
  await page.waitForTimeout(800);
  await shot(page, '36-admin-access-code-modal');

  await browser.close();
  console.log('\n✅ Admin screenshots saved.');
})();
