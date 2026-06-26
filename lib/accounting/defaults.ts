import { prisma } from '@/lib/db';

// Default Nigerian SME Chart of Accounts
// Numbering: 1xxx=Assets, 2xxx=Liabilities, 3xxx=Equity, 4xxx=Revenue, 5xxx=COGS, 6xxx=OpEx
const DEFAULT_ACCOUNTS = [
  // ── ASSETS ──
  { code: '1000', name: 'ASSETS',               type: 'ASSET',     allowPosting: false, level: 1 },
  { code: '1100', name: 'Current Assets',        type: 'ASSET',     allowPosting: false, level: 2, parent: '1000' },
  { code: '1110', name: 'Cash on Hand',          type: 'ASSET',     level: 3, parent: '1100', systemTag: 'CASH', system: true },
  { code: '1120', name: 'Cash at Bank',          type: 'ASSET',     level: 3, parent: '1100', systemTag: 'BANK', system: true },
  { code: '1130', name: 'Petty Cash',            type: 'ASSET',     level: 3, parent: '1100', systemTag: 'PETTY_CASH', system: true },
  { code: '1200', name: 'Accounts Receivable',   type: 'ASSET',     level: 2, parent: '1000', systemTag: 'AR', system: true },
  { code: '1210', name: 'Trade Receivables',     type: 'ASSET',     level: 3, parent: '1200' },
  { code: '1300', name: 'Inventory',             type: 'ASSET',     level: 2, parent: '1000', systemTag: 'INVENTORY', system: true },
  { code: '1400', name: 'Prepaid Expenses',      type: 'ASSET',     level: 2, parent: '1000' },
  { code: '1500', name: 'Input VAT',             type: 'ASSET',     level: 2, parent: '1000', systemTag: 'VAT_INPUT', system: true },
  { code: '1600', name: 'Fixed Assets',          type: 'ASSET',     allowPosting: false, level: 2, parent: '1000' },
  { code: '1610', name: 'Property & Equipment',  type: 'ASSET',     level: 3, parent: '1600' },
  { code: '1620', name: 'Motor Vehicles',        type: 'ASSET',     level: 3, parent: '1600' },
  { code: '1630', name: 'Furniture & Fittings',  type: 'ASSET',     level: 3, parent: '1600' },
  { code: '1640', name: 'IT Equipment',          type: 'ASSET',     level: 3, parent: '1600' },
  { code: '1700', name: 'Accumulated Depreciation', type: 'ASSET',  level: 2, parent: '1000', sub: 'contra_asset' },

  // ── LIABILITIES ──
  { code: '2000', name: 'LIABILITIES',           type: 'LIABILITY', allowPosting: false, level: 1 },
  { code: '2100', name: 'Current Liabilities',   type: 'LIABILITY', allowPosting: false, level: 2, parent: '2000' },
  { code: '2110', name: 'Accounts Payable',      type: 'LIABILITY', level: 3, parent: '2100', systemTag: 'AP', system: true },
  { code: '2120', name: 'Accrued Expenses',      type: 'LIABILITY', level: 3, parent: '2100' },
  { code: '2130', name: 'Short-term Loans',      type: 'LIABILITY', level: 3, parent: '2100' },
  { code: '2200', name: 'Output VAT Payable',    type: 'LIABILITY', level: 2, parent: '2000', systemTag: 'VAT_OUTPUT', system: true },
  { code: '2300', name: 'Withholding Tax Payable', type: 'LIABILITY', level: 2, parent: '2000', systemTag: 'WHT', system: true },
  { code: '2400', name: 'PAYE Tax Payable',      type: 'LIABILITY', level: 2, parent: '2000', systemTag: 'PAYE', system: true },
  { code: '2500', name: 'Long-term Liabilities', type: 'LIABILITY', allowPosting: false, level: 2, parent: '2000' },
  { code: '2510', name: 'Bank Loans',            type: 'LIABILITY', level: 3, parent: '2500' },

  // ── EQUITY ──
  { code: '3000', name: 'EQUITY',                type: 'EQUITY',    allowPosting: false, level: 1 },
  { code: '3100', name: "Owner's Capital",       type: 'EQUITY',    level: 2, parent: '3000' },
  { code: '3200', name: 'Retained Earnings',     type: 'EQUITY',    level: 2, parent: '3000', systemTag: 'RETAINED_EARNINGS', system: true },
  { code: '3300', name: 'Current Year Profit',   type: 'EQUITY',    level: 2, parent: '3000', systemTag: 'CURRENT_YEAR_PROFIT', system: true },

  // ── REVENUE ──
  { code: '4000', name: 'REVENUE',               type: 'INCOME',    allowPosting: false, level: 1 },
  { code: '4100', name: 'Sales Revenue',         type: 'INCOME',    level: 2, parent: '4000', systemTag: 'SALES', system: true },
  { code: '4110', name: 'Product Sales',         type: 'INCOME',    level: 3, parent: '4100' },
  { code: '4120', name: 'Service Revenue',       type: 'INCOME',    level: 3, parent: '4100', systemTag: 'SERVICE_REVENUE', system: true },
  { code: '4130', name: 'Commission Income',     type: 'INCOME',    level: 3, parent: '4100' },
  { code: '4200', name: 'Other Income',          type: 'INCOME',    allowPosting: false, level: 2, parent: '4000' },
  { code: '4210', name: 'Rental Income',         type: 'INCOME',    level: 3, parent: '4200' },
  { code: '4220', name: 'Interest Income',       type: 'INCOME',    level: 3, parent: '4200' },
  { code: '4230', name: 'Discount Received',     type: 'INCOME',    level: 3, parent: '4200' },

  // ── COST OF SALES ──
  { code: '5000', name: 'COST OF SALES',         type: 'EXPENSE',   allowPosting: false, level: 1 },
  { code: '5100', name: 'Cost of Goods Sold',    type: 'EXPENSE',   level: 2, parent: '5000', systemTag: 'COGS', system: true },
  { code: '5200', name: 'Direct Labour',         type: 'EXPENSE',   level: 2, parent: '5000' },
  { code: '5300', name: 'Direct Materials',      type: 'EXPENSE',   level: 2, parent: '5000' },
  { code: '5400', name: 'Shipping & Delivery',   type: 'EXPENSE',   level: 2, parent: '5000' },

  // ── OPERATING EXPENSES ──
  { code: '6000', name: 'OPERATING EXPENSES',    type: 'EXPENSE',   allowPosting: false, level: 1 },
  { code: '6100', name: 'Personnel Costs',       type: 'EXPENSE',   allowPosting: false, level: 2, parent: '6000' },
  { code: '6110', name: 'Staff Salaries',        type: 'EXPENSE',   level: 3, parent: '6100', systemTag: 'SALARIES', system: true },
  { code: '6120', name: 'Contract Labour',       type: 'EXPENSE',   level: 3, parent: '6100' },
  { code: '6130', name: 'Staff Benefits',        type: 'EXPENSE',   level: 3, parent: '6100' },
  { code: '6200', name: 'Occupancy Costs',       type: 'EXPENSE',   allowPosting: false, level: 2, parent: '6000' },
  { code: '6210', name: 'Rent',                  type: 'EXPENSE',   level: 3, parent: '6200' },
  { code: '6220', name: 'Electricity',           type: 'EXPENSE',   level: 3, parent: '6200' },
  { code: '6230', name: 'Water & Sanitation',    type: 'EXPENSE',   level: 3, parent: '6200' },
  { code: '6300', name: 'Marketing & Advertising', type: 'EXPENSE', level: 2, parent: '6000' },
  { code: '6400', name: 'Transportation',        type: 'EXPENSE',   level: 2, parent: '6000' },
  { code: '6500', name: 'Professional Services', type: 'EXPENSE',   allowPosting: false, level: 2, parent: '6000' },
  { code: '6510', name: 'Legal Fees',            type: 'EXPENSE',   level: 3, parent: '6500' },
  { code: '6520', name: 'Accounting Fees',       type: 'EXPENSE',   level: 3, parent: '6500' },
  { code: '6530', name: 'Consulting Fees',       type: 'EXPENSE',   level: 3, parent: '6500' },
  { code: '6600', name: 'Bank Charges',          type: 'EXPENSE',   level: 2, parent: '6000' },
  { code: '6700', name: 'Depreciation Expense',  type: 'EXPENSE',   level: 2, parent: '6000', systemTag: 'DEPRECIATION', system: true },
  { code: '6800', name: 'Miscellaneous Expenses',type: 'EXPENSE',   level: 2, parent: '6000' },
  { code: '6900', name: 'Tax Expense',           type: 'EXPENSE',   level: 2, parent: '6000', systemTag: 'TAX_EXPENSE', system: true },
];

export async function seedDefaultAccounts(tenantId: string): Promise<void> {
  const existing = await prisma.glAccount.count({ where: { tenantId } });
  if (existing > 0) return;

  const codeToId = new Map<string, string>();

  // Insert in level order so parents exist before children
  const sorted = [...DEFAULT_ACCOUNTS].sort((a, b) => (a.level ?? 1) - (b.level ?? 1));

  for (const acct of sorted) {
    const parentId = acct.parent ? (codeToId.get(acct.parent) ?? null) : null;
    const created = await prisma.glAccount.create({
      data: {
        tenantId,
        code: acct.code,
        name: acct.name,
        accountType: acct.type as any,
        accountSubtype: (acct as any).sub ?? null,
        parentId,
        level: acct.level ?? 1,
        allowPosting: acct.allowPosting !== false,
        isSystemAccount: (acct as any).system === true,
        systemTag: (acct as any).systemTag ?? null,
      },
    });
    codeToId.set(acct.code, created.id);
  }
}

export async function ensureDefaultAccounts(tenantId: string): Promise<void> {
  await seedDefaultAccounts(tenantId);
}
