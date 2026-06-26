import { prisma } from '@/lib/db';

// Normal balance direction: debit-normal types increase on debit; credit-normal types increase on credit
const DEBIT_NORMAL = new Set(['ASSET', 'EXPENSE']);

export interface JournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
  customerId?: string;
  vendorId?: string;
  branchCode?: string;
  projectCode?: string;
}

export interface CreateJournalInput {
  tenantId: string;
  entryDate: Date;
  description: string;
  entryType: string;
  reference?: string;
  currency?: string;
  sourceType?: string;
  sourceId?: string;
  notes?: string;
  createdById?: string;
  lines: JournalLineInput[];
}

export class AccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountingError';
  }
}

function validateBalance(lines: JournalLineInput[]): void {
  const totalDebit = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.005) {
    throw new AccountingError(
      `Unbalanced journal: debits ${totalDebit.toFixed(2)} ≠ credits ${totalCredit.toFixed(2)} (diff: ${diff.toFixed(2)})`
    );
  }
}

async function nextEntryNumber(tenantId: string): Promise<string> {
  const count = await prisma.journalEntry.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function findOrCreatePeriod(tenantId: string, date: Date): Promise<string | null> {
  const existing = await prisma.accountingPeriod.findFirst({
    where: { tenantId, startDate: { lte: date }, endDate: { gte: date }, status: 'OPEN' },
  });
  if (existing) return existing.id;

  const year = date.getFullYear();
  const fyName = `FY ${year}`;

  let fy = await prisma.fiscalYear.findFirst({ where: { tenantId, name: fyName } });
  if (!fy) {
    fy = await prisma.fiscalYear.create({
      data: {
        tenantId, name: fyName,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        status: 'OPEN', isDefault: true,
      },
    });
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    await prisma.accountingPeriod.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        tenantId, fiscalYearId: fy!.id, periodNumber: i + 1,
        name: `${MONTHS[i]} ${year}`,
        startDate: new Date(year, i, 1),
        endDate: new Date(year, i + 1, 0),
        status: 'OPEN' as const,
      })),
    });
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { tenantId, fiscalYearId: fy.id, startDate: { lte: date }, endDate: { gte: date } },
  });
  return period?.id ?? null;
}

export async function createJournalEntry(input: CreateJournalInput) {
  if (input.lines.length < 2) throw new AccountingError('A journal entry requires at least 2 lines');
  validateBalance(input.lines);

  const periodId = await findOrCreatePeriod(input.tenantId, input.entryDate);
  const entryNumber = await nextEntryNumber(input.tenantId);
  const totalDebit = input.lines.reduce((s, l) => s + (l.debit ?? 0), 0);

  return prisma.journalEntry.create({
    data: {
      tenantId: input.tenantId, entryNumber, periodId,
      entryDate: input.entryDate, description: input.description,
      entryType: input.entryType as any, status: 'DRAFT',
      reference: input.reference, currency: input.currency ?? 'NGN',
      sourceType: input.sourceType, sourceId: input.sourceId,
      notes: input.notes, createdById: input.createdById,
      totalDebit, totalCredit: totalDebit,
      lines: {
        create: input.lines.map((l, i) => ({
          accountId: l.accountId, lineNumber: i + 1,
          description: l.description,
          debit: l.debit ?? 0, credit: l.credit ?? 0,
          baseDebit: l.debit ?? 0, baseCredit: l.credit ?? 0,
          customerId: l.customerId, vendorId: l.vendorId,
          branchCode: l.branchCode, projectCode: l.projectCode,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function createAndPostJournal(input: CreateJournalInput, postedById?: string) {
  const entry = await createJournalEntry(input);
  return postJournal(entry.id, input.tenantId, postedById);
}

export async function postJournal(entryId: string, tenantId: string, postedById?: string) {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId }, include: { lines: true },
  });
  if (!entry) throw new AccountingError('Journal entry not found');
  if (entry.tenantId !== tenantId) throw new AccountingError('Unauthorized');
  if (entry.status === 'POSTED') throw new AccountingError('Already posted');
  if (entry.status !== 'DRAFT' && entry.status !== 'PENDING_APPROVAL') {
    throw new AccountingError(`Cannot post entry in status: ${entry.status}`);
  }
  validateBalance(entry.lines.map(l => ({ accountId: l.accountId, debit: Number(l.debit), credit: Number(l.credit) })));

  return prisma.journalEntry.update({
    where: { id: entryId },
    data: { status: 'POSTED', postingDate: new Date(), postedById, postedAt: new Date() },
    include: { lines: true },
  });
}

export async function reverseJournal(
  entryId: string, tenantId: string, reversalDate: Date, reason: string, userId?: string
) {
  const original = await prisma.journalEntry.findUnique({
    where: { id: entryId }, include: { lines: true },
  });
  if (!original) throw new AccountingError('Journal entry not found');
  if (original.tenantId !== tenantId) throw new AccountingError('Unauthorized');
  if (original.status !== 'POSTED') throw new AccountingError('Only posted entries can be reversed');
  if (original.reversedByEntryId) throw new AccountingError('Entry already reversed');

  const periodId = await findOrCreatePeriod(tenantId, reversalDate);
  const entryNumber = await nextEntryNumber(tenantId);

  return prisma.$transaction(async (tx) => {
    const reversal = await tx.journalEntry.create({
      data: {
        tenantId, entryNumber, periodId,
        entryDate: reversalDate, postingDate: reversalDate,
        description: `REVERSAL: ${original.description}`,
        reference: original.reference, entryType: original.entryType,
        status: 'POSTED', currency: original.currency,
        isReversal: true, reversesEntryId: original.id,
        totalDebit: original.totalDebit, totalCredit: original.totalCredit,
        notes: reason, postedById: userId, postedAt: new Date(), createdById: userId,
        lines: {
          create: original.lines.map((l, i) => ({
            accountId: l.accountId, lineNumber: i + 1, description: l.description,
            debit: l.credit, credit: l.debit,
            baseDebit: l.baseCredit, baseCredit: l.baseDebit,
            customerId: l.customerId, vendorId: l.vendorId,
          })),
        },
      },
    });
    await tx.journalEntry.update({
      where: { id: original.id },
      data: { status: 'REVERSED', reversedByEntryId: reversal.id },
    });
    return reversal;
  });
}

export async function getAccountBalance(accountId: string, asOf?: Date): Promise<number> {
  const account = await prisma.glAccount.findUnique({
    where: { id: accountId }, select: { accountType: true, openingBalance: true },
  });
  if (!account) return 0;

  const result = await prisma.journalLine.aggregate({
    where: {
      accountId,
      journalEntry: { status: 'POSTED', ...(asOf ? { entryDate: { lte: asOf } } : {}) },
    },
    _sum: { debit: true, credit: true },
  });

  const totalDebit = Number(result._sum.debit ?? 0);
  const totalCredit = Number(result._sum.credit ?? 0);
  const opening = Number(account.openingBalance);
  return DEBIT_NORMAL.has(account.accountType)
    ? opening + totalDebit - totalCredit
    : opening + totalCredit - totalDebit;
}

export async function findSystemAccount(tenantId: string, tag: string): Promise<string | null> {
  const account = await prisma.glAccount.findFirst({
    where: { tenantId, systemTag: tag, isActive: true },
    select: { id: true },
  });
  return account?.id ?? null;
}
