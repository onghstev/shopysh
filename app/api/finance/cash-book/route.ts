export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const from = searchParams.get('from') ?? defaultFrom;
    const to = searchParams.get('to') ?? defaultTo;

    // Find CASH account
    const account = await prisma.glAccount.findFirst({
      where: { tenantId, systemTag: 'CASH', isActive: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cash account not found. Please set up your Chart of Accounts.' }, { status: 404 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to + 'T23:59:59Z');

    // Get all lines before the from date to compute opening balance
    const priorLines = await prisma.journalLine.findMany({
      where: {
        accountId: account.id,
        journalEntry: { tenantId, status: 'POSTED', entryDate: { lt: fromDate } },
      },
      select: { debit: true, credit: true },
    });

    const priorMovement = priorLines.reduce((sum, l) => sum + Number(l.debit) - Number(l.credit), 0);
    const openingBalance = Number(account.openingBalance ?? 0) + priorMovement;

    // Get lines within the date range (POSTED and DRAFT)
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: account.id,
        journalEntry: { tenantId, status: { in: ['POSTED', 'DRAFT'] }, entryDate: { gte: fromDate, lte: toDate } },
      },
      include: {
        journalEntry: { select: { id: true, entryNumber: true, entryDate: true, description: true, reference: true, entryType: true, status: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: [{ journalEntry: { entryDate: 'asc' } }, { journalEntry: { entryNumber: 'asc' } }],
    });

    // Compute running balance (only include POSTED lines for balance calculation)
    let running = openingBalance;
    const linesWithBalance = lines.map(l => {
      if (l.journalEntry.status === 'POSTED') {
        running = running + Number(l.debit) - Number(l.credit);
      }
      return {
        id: l.id,
        journalEntryId: l.journalEntry.id,
        date: l.journalEntry.entryDate,
        entryNumber: l.journalEntry.entryNumber,
        description: l.description || l.journalEntry.description,
        reference: l.journalEntry.reference,
        entryType: l.journalEntry.entryType,
        status: l.journalEntry.status,
        debit: Number(l.debit),
        credit: Number(l.credit),
        runningBalance: running,
        customer: l.customer ?? null,
      };
    });

    const totalReceipts = lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalPayments = lines.reduce((s, l) => s + Number(l.credit), 0);

    return NextResponse.json({
      account: { id: account.id, code: account.code, name: account.name },
      openingBalance,
      lines: linesWithBalance,
      totals: { totalReceipts, totalPayments, closingBalance: running },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
