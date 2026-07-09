export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const journals = await prisma.recurringJournal.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { nextRunDate: 'asc' },
    });

    return NextResponse.json(journals);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { name, description, frequency, dayOfMonth, entryType, currency, nextRunDate, endDate, lines } = body;

    if (!name) return badRequest('Name is required');
    if (!frequency) return badRequest('Frequency is required');
    if (!nextRunDate) return badRequest('Next run date is required');
    if (!lines || lines.length === 0) return badRequest('At least one journal line is required');

    // Validate balanced journal
    const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return badRequest('Journal lines must balance (total debits must equal total credits)');
    }

    const journal = await prisma.recurringJournal.create({
      data: {
        tenantId,
        name,
        description: description || null,
        frequency,
        dayOfMonth: dayOfMonth || null,
        entryType: entryType || 'GENERAL_JOURNAL',
        currency: currency || 'NGN',
        nextRunDate: new Date(nextRunDate),
        endDate: endDate ? new Date(endDate) : null,
        lines: {
          create: lines.map((l: any) => ({
            accountId:   l.accountId,
            debit:       Number(l.debit || 0),
            credit:      Number(l.credit || 0),
            description: l.description || null,
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json(journal, { status: 201 });
  } catch (e) { return serverError(e); }
}
