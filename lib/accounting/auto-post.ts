/**
 * Auto-posting: translates business events into double-entry journal entries.
 * Called after key operations (order paid, expense approved, etc.).
 * Silently no-ops when Chart of Accounts hasn't been seeded yet — never throws.
 */

import { createAndPostJournal, findSystemAccount } from './engine';
import { ensureDefaultAccounts } from './defaults';

async function safePost(fn: () => Promise<unknown>): Promise<void> {
  try { await fn(); } catch (e) {
    // Never let accounting failures break the main business flow
    console.error('[accounting/auto-post]', e);
  }
}

/** Order payment received: DR Cash/Bank, CR Sales Revenue */
export async function postOrderPayment(opts: {
  tenantId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  description?: string;
}) {
  await safePost(async () => {
    await ensureDefaultAccounts(opts.tenantId);

    const cashTag = opts.paymentMethod?.toLowerCase().includes('bank') ? 'BANK' : 'CASH';
    const cashId = await findSystemAccount(opts.tenantId, cashTag);
    const salesId = await findSystemAccount(opts.tenantId, 'SALES');
    if (!cashId || !salesId) return;

    await createAndPostJournal({
      tenantId: opts.tenantId,
      entryDate: new Date(),
      description: opts.description ?? `Payment received – Order #${opts.orderId.slice(-6)}`,
      entryType: 'SALES_RECEIPT',
      sourceType: 'ORDER',
      sourceId: opts.orderId,
      currency: opts.currency ?? 'NGN',
      lines: [
        { accountId: cashId, debit: opts.amount, description: 'Cash/bank received' },
        { accountId: salesId, credit: opts.amount, description: 'Sales revenue' },
      ],
    });
  });
}

/** Order fulfilled: DR COGS, CR Inventory (if inventory account exists) */
export async function postOrderCOGS(opts: {
  tenantId: string;
  orderId: string;
  cogsAmount: number;
  currency?: string;
  description?: string;
}) {
  await safePost(async () => {
    await ensureDefaultAccounts(opts.tenantId);
    const cogsId = await findSystemAccount(opts.tenantId, 'COGS');
    const inventoryId = await findSystemAccount(opts.tenantId, 'INVENTORY');
    if (!cogsId || !inventoryId || opts.cogsAmount <= 0) return;

    await createAndPostJournal({
      tenantId: opts.tenantId,
      entryDate: new Date(),
      description: opts.description ?? `Cost of goods – Order #${opts.orderId.slice(-6)}`,
      entryType: 'INVENTORY_ADJUSTMENT',
      sourceType: 'ORDER',
      sourceId: opts.orderId,
      currency: opts.currency ?? 'NGN',
      lines: [
        { accountId: cogsId, debit: opts.cogsAmount, description: 'Cost of goods sold' },
        { accountId: inventoryId, credit: opts.cogsAmount, description: 'Inventory reduction' },
      ],
    });
  });
}

/** Invoice raised against customer: DR AR, CR Sales Revenue */
export async function postInvoiceCreated(opts: {
  tenantId: string;
  invoiceId: string;
  customerId?: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
}) {
  await safePost(async () => {
    await ensureDefaultAccounts(opts.tenantId);

    const arId = await findSystemAccount(opts.tenantId, 'AR');
    const salesId = await findSystemAccount(opts.tenantId, 'SALES');
    if (!arId || !salesId) return;

    const lines: { accountId: string; debit?: number; credit?: number; description?: string; customerId?: string }[] = [
      { accountId: arId, debit: opts.amount, description: 'Accounts receivable', customerId: opts.customerId },
      { accountId: salesId, credit: opts.amount - (opts.taxAmount ?? 0), description: 'Sales revenue' },
    ];

    if (opts.taxAmount && opts.taxAmount > 0) {
      const vatId = await findSystemAccount(opts.tenantId, 'VAT_OUTPUT');
      if (vatId) lines.push({ accountId: vatId, credit: opts.taxAmount, description: 'Output VAT' });
    }

    await createAndPostJournal({
      tenantId: opts.tenantId,
      entryDate: new Date(),
      description: `Invoice raised – #${opts.invoiceId.slice(-6)}`,
      entryType: 'SALES_INVOICE',
      sourceType: 'INVOICE',
      sourceId: opts.invoiceId,
      currency: opts.currency ?? 'NGN',
      lines,
    });
  });
}

/** Asset depreciation: DR Depreciation Expense, CR Accumulated Depreciation */
export async function postAssetDepreciation(opts: {
  tenantId: string;
  assetId: string;
  assetName: string;
  amount: number;
  currency?: string;
  entryDate?: Date;
  journalEntryId?: string;
}) {
  await safePost(async () => {
    await ensureDefaultAccounts(opts.tenantId);
    const { prisma } = await import('@/lib/db');

    // Depreciation Expense account (code 6700) and Accumulated Depreciation (code 1700)
    const depExpAccount = await prisma.glAccount.findFirst({
      where: { tenantId: opts.tenantId, code: '6700' },
      select: { id: true },
    });
    const accumDepAccount = await prisma.glAccount.findFirst({
      where: { tenantId: opts.tenantId, code: '1700' },
      select: { id: true },
    });
    if (!depExpAccount || !accumDepAccount) return;

    await createAndPostJournal({
      tenantId:    opts.tenantId,
      entryDate:   opts.entryDate ?? new Date(),
      description: `Depreciation – ${opts.assetName}`,
      entryType:   'DEPRECIATION',
      sourceType:  'FIXED_ASSET',
      sourceId:    opts.assetId,
      currency:    opts.currency ?? 'NGN',
      lines: [
        { accountId: depExpAccount.id,  debit:  opts.amount, description: 'Depreciation expense' },
        { accountId: accumDepAccount.id, credit: opts.amount, description: 'Accumulated depreciation' },
      ],
    });
  });
}

/** Expense approved/recorded: DR Expense category account, CR Cash/AP */
export async function postExpenseRecorded(opts: {
  tenantId: string;
  expenseId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  glAccountCode?: string;
  description?: string;
}) {
  await safePost(async () => {
    await ensureDefaultAccounts(opts.tenantId);

    const expenseId = await findSystemAccount(opts.tenantId, 'SALARIES') ?? null;
    const miscId = await (async () => {
      const { prisma } = await import('@/lib/db');
      const acc = await prisma.glAccount.findFirst({
        where: { tenantId: opts.tenantId, code: '6800' },
        select: { id: true },
      });
      return acc?.id ?? null;
    })();

    const expAccId = miscId;
    const cashTag = opts.paymentMethod?.toLowerCase().includes('bank') ? 'BANK' : 'CASH';
    const cashId = await findSystemAccount(opts.tenantId, cashTag);
    if (!expAccId || !cashId) return;

    await createAndPostJournal({
      tenantId: opts.tenantId,
      entryDate: new Date(),
      description: opts.description ?? `Expense – ${opts.expenseId.slice(-6)}`,
      entryType: 'EXPENSE_CLAIM',
      sourceType: 'EXPENSE',
      sourceId: opts.expenseId,
      currency: opts.currency ?? 'NGN',
      lines: [
        { accountId: expAccId, debit: opts.amount, description: 'Expense' },
        { accountId: cashId, credit: opts.amount, description: 'Cash/bank payment' },
      ],
    });
  });
}
