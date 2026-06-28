// Screenshot capture script for user guide
// Run: node scripts/capture-screenshots.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8088';
const OUT_DIR = path.join(__dirname, '..', 'public', 'guide', 'screenshots');
const EMAIL = 'john@doe.com';
const PASSWORD = 'johndoe123';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name, waitMs = 800) {
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.jpg`), fullPage: false, type: 'jpeg', quality: 88 });
  console.log(`✓ ${name}.jpg`);
}

async function shotFull(page, name, waitMs = 800) {
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.jpg`), fullPage: true, type: 'jpeg', quality: 88 });
  console.log(`✓ ${name}.jpg (full)`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 820 } });
  const page = await context.newPage();

  // ── 1. Login page ──────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`);
  await shot(page, '01-login');

  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // ── 2. Dashboard ───────────────────────────────────────────────────────────
  await shot(page, '02-dashboard', 1500);
  await shotFull(page, '02-dashboard-full', 1500);

  // ── 3. Products list ───────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/products`);
  await shot(page, '03-products', 1200);

  // ── 4. Add product form ────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/products/new`);
  await shot(page, '04-product-new', 1200);

  // ── 5. Orders ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/orders`);
  await shot(page, '05-orders', 1200);

  // ── 6. Customers ───────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/customers`);
  await shot(page, '06-customers', 1200);

  // ── 7. Payments ────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/payments`);
  await shot(page, '07-payments', 1200);

  // ── 8. Finance overview ────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance`);
  await shot(page, '08-finance-overview', 1500);
  await shotFull(page, '08-finance-overview-full', 1500);

  // ── 9. Chart of accounts ───────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/accounts`);
  await shot(page, '09-finance-accounts', 1500);

  // ── 10. CoA template modal ────────────────────────────────────────────────
  await page.click('button:has-text("Choose Template")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '10-finance-accounts-template');
  await page.keyboard.press('Escape');

  // ── 11. Journal entries ───────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/journal`);
  await shot(page, '11-finance-journal', 1200);

  // ── 12. New journal entry modal ───────────────────────────────────────────
  await page.click('button:has-text("New Journal")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '12-finance-journal-new');
  await page.keyboard.press('Escape');

  // ── 13. Cash book ─────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/cash-book`);
  await shot(page, '13-finance-cash-book', 1200);

  // ── 14. Bank book ─────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/bank-book`);
  await shot(page, '14-finance-bank-book', 1200);

  // ── 15. Sales book ────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/sales-book`);
  await shot(page, '15-finance-sales-book', 1200);

  // ── 16. Record sale modal ─────────────────────────────────────────────────
  await page.click('button:has-text("Record Sale")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '16-finance-sales-book-modal');
  await page.keyboard.press('Escape');

  // ── 17. Purchase book ─────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/purchase-book`);
  await shot(page, '17-finance-purchase-book', 1200);

  // ── 18. Record purchase modal ─────────────────────────────────────────────
  await page.click('button:has-text("Record Purchase")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '18-finance-purchase-book-modal');
  await page.keyboard.press('Escape');

  // ── 19. Receivables ───────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/receivables`);
  await shot(page, '19-finance-receivables', 1200);

  // ── 20. Payables ──────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/payables`);
  await shot(page, '20-finance-payables', 1200);

  // ── 21. Vendors ───────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/vendors`);
  await shot(page, '21-finance-vendors', 1200);

  // ── 22. Add vendor modal ──────────────────────────────────────────────────
  await page.click('button:has-text("Add Vendor")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '22-finance-vendors-modal');
  await page.keyboard.press('Escape');

  // ── 23. Statements ────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/statements`);
  await shot(page, '23-finance-statements', 1500);

  // ── 24. Trial balance ─────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/reports/trial-balance`);
  await shot(page, '24-finance-trial-balance', 1200);
  await page.click('button:has-text("Generate")', { timeout: 5000 }).catch(() => {});
  await shot(page, '24b-finance-trial-balance-result', 1500);

  // ── 25. Income statement ──────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/reports/income-statement`);
  await shot(page, '25-finance-income-statement', 1200);
  await page.click('button:has-text("Generate")', { timeout: 5000 }).catch(() => {});
  await shot(page, '25b-finance-income-statement-result', 1500);

  // ── 26. Balance sheet ─────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/finance/reports/balance-sheet`);
  await shot(page, '26-finance-balance-sheet', 1200);
  await page.click('button:has-text("Generate")', { timeout: 5000 }).catch(() => {});
  await shot(page, '26b-finance-balance-sheet-result', 1500);

  // ── 27. Campaigns ─────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/campaigns`);
  await shot(page, '27-campaigns', 1200);

  // ── 28. AI Assistant ──────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/ai-assistant`);
  await shot(page, '28-ai-assistant', 1200);

  // ── 29. Settings – profile tab ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/settings`);
  await shot(page, '29-settings', 1500);
  await shotFull(page, '29-settings-full', 1500);

  // ── 30. Analytics ─────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/analytics`);
  await shot(page, '30-analytics', 1500);

  // ── 31. Team ──────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/team`);
  await shot(page, '31-team', 1200);

  // ── 32. User guide page (the guide itself) ────────────────────────────────
  await page.goto(`${BASE_URL}/guide`);
  await shot(page, '32-guide', 1500);

  await browser.close();
  console.log('\n✅ All screenshots saved to public/guide/screenshots/');
})();
