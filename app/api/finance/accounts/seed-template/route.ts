export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { seedDefaultAccounts } from '@/lib/accounting/defaults';

const SIMPLE_ACCOUNTS = [
  { code: '1000', name: 'Cash & Bank',          type: 'ASSET',     allowPosting: false, level: 1 },
  { code: '1100', name: 'Cash on Hand',          type: 'ASSET',     level: 2, parent: '1000', systemTag: 'CASH',              system: true },
  { code: '1200', name: 'Bank Account',          type: 'ASSET',     level: 2, parent: '1000', systemTag: 'BANK',              system: true },
  { code: '1300', name: 'Accounts Receivable',   type: 'ASSET',     level: 2, parent: '1000', systemTag: 'AR',                system: true },
  { code: '1400', name: 'Inventory',             type: 'ASSET',     level: 2, parent: '1000', systemTag: 'INVENTORY',         system: true },
  { code: '2000', name: 'Liabilities',           type: 'LIABILITY', allowPosting: false, level: 1 },
  { code: '2100', name: 'Accounts Payable',      type: 'LIABILITY', level: 2, parent: '2000', systemTag: 'AP',                system: true },
  { code: '2200', name: 'VAT Payable',           type: 'LIABILITY', level: 2, parent: '2000', systemTag: 'VAT_OUTPUT',        system: true },
  { code: '3000', name: "Owner's Equity",        type: 'EQUITY',    allowPosting: false, level: 1 },
  { code: '3100', name: 'Capital',               type: 'EQUITY',    level: 2, parent: '3000' },
  { code: '3200', name: 'Retained Earnings',     type: 'EQUITY',    level: 2, parent: '3000', systemTag: 'RETAINED_EARNINGS', system: true },
  { code: '4000', name: 'Revenue',               type: 'INCOME',    allowPosting: false, level: 1 },
  { code: '4100', name: 'Sales Revenue',         type: 'INCOME',    level: 2, parent: '4000', systemTag: 'SALES',             system: true,  allowPosting: true },
  { code: '4200', name: 'Other Income',          type: 'INCOME',    level: 2, parent: '4000', allowPosting: true },
  { code: '5000', name: 'Cost of Sales',         type: 'EXPENSE',   allowPosting: false, level: 1 },
  { code: '5100', name: 'Cost of Goods Sold',    type: 'EXPENSE',   level: 2, parent: '5000', systemTag: 'COGS',              system: true,  allowPosting: true },
  { code: '6000', name: 'Operating Expenses',    type: 'EXPENSE',   allowPosting: false, level: 1 },
  { code: '6100', name: 'Salaries',              type: 'EXPENSE',   level: 2, parent: '6000', systemTag: 'SALARIES',          system: true,  allowPosting: true },
  { code: '6200', name: 'Rent',                  type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
  { code: '6300', name: 'Utilities',             type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
  { code: '6400', name: 'Office Supplies',       type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
  { code: '6500', name: 'Marketing',             type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
  { code: '6600', name: 'Bank Charges',          type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
  { code: '6700', name: 'Depreciation',          type: 'EXPENSE',   level: 2, parent: '6000', systemTag: 'DEPRECIATION',      system: true,  allowPosting: true },
  { code: '6800', name: 'Miscellaneous Expense', type: 'EXPENSE',   level: 2, parent: '6000', allowPosting: true },
];

async function seedSimpleAccounts(tenantId: string): Promise<void> {
  const codeToId = new Map<string, string>();
  const sorted = [...SIMPLE_ACCOUNTS].sort((a, b) => (a.level ?? 1) - (b.level ?? 1));

  for (const acct of sorted) {
    const parentId = acct.parent ? (codeToId.get(acct.parent) ?? null) : null;
    const created = await prisma.glAccount.create({
      data: {
        tenantId,
        code: acct.code,
        name: acct.name,
        accountType: acct.type as any,
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const template: string = body.template ?? 'nigerian';
    const replace: boolean = body.replace === true;

    // If accounts exist and replace not confirmed, return a specific code so UI can prompt
    const existing = await prisma.glAccount.count({ where: { tenantId } });
    if (existing > 0 && !replace) {
      return NextResponse.json({ error: 'Chart of Accounts already has entries. Cannot seed template.', code: 'ACCOUNTS_EXIST', count: existing }, { status: 409 });
    }

    // Wipe existing accounts (cascade deletes journal lines referencing them)
    if (existing > 0 && replace) {
      await prisma.glAccount.deleteMany({ where: { tenantId } });
    }

    if (template === 'simple') {
      await seedSimpleAccounts(tenantId);
    } else if (template === 'nigerian' || template === 'retail') {
      await seedDefaultAccounts(tenantId);
    } else {
      return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 });
    }

    const count = await prisma.glAccount.count({ where: { tenantId } });
    return NextResponse.json({ success: true, template, accountsCreated: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
