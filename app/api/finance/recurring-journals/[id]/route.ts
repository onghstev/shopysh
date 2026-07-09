export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const existing = await prisma.recurringJournal.findFirst({ where: { id: params.id, tenantId } });
    if (!existing) return notFound();

    const body = await req.json();
    const { action, ...data } = body;

    // Special action: run now (post a journal entry immediately)
    if (action === 'run') {
      return await runJournal(existing.id, tenantId);
    }

    // Toggle active status
    if (action === 'toggle') {
      const updated = await prisma.recurringJournal.update({
        where: { id: params.id },
        data: { isActive: !existing.isActive },
      });
      return NextResponse.json(updated);
    }

    // General update
    const updated = await prisma.recurringJournal.update({
      where: { id: params.id },
      data: {
        name:        data.name ?? existing.name,
        description: data.description ?? existing.description,
        frequency:   data.frequency ?? existing.frequency,
        dayOfMonth:  data.dayOfMonth ?? existing.dayOfMonth,
        nextRunDate: data.nextRunDate ? new Date(data.nextRunDate) : existing.nextRunDate,
        endDate:     data.endDate ? new Date(data.endDate) : existing.endDate,
        isActive:    data.isActive ?? existing.isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const existing = await prisma.recurringJournal.findFirst({ where: { id: params.id, tenantId } });
    if (!existing) return notFound();

    await prisma.recurringJournal.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return serverError(e); }
}

async function runJournal(recurringJournalId: string, tenantId: string) {
  const rj = await prisma.recurringJournal.findFirst({
    where: { id: recurringJournalId, tenantId },
    include: { lines: true },
  });
  if (!rj) return notFound();

  const now = new Date();
  const entryNumber = `RJ-${Date.now()}`;

  const totalDebit  = rj.lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = rj.lines.reduce((s, l) => s + Number(l.credit), 0);

  const entry = await prisma.journalEntry.create({
    data: {
      tenantId,
      entryNumber,
      entryDate:   now,
      postingDate: now,
      description: rj.name,
      entryType:   rj.entryType as any,
      status:      'POSTED',
      currency:    rj.currency,
      totalDebit,
      totalCredit,
      recurringJournalId: rj.id,
      postedAt:    now,
      lines: {
        create: rj.lines.map((l, i) => ({
          accountId:   l.accountId,
          lineNumber:  i + 1,
          description: l.description || rj.name,
          debit:       l.debit,
          credit:      l.credit,
        })),
      },
    },
  });

  // Advance nextRunDate
  const next = computeNextRun(rj.frequency, rj.dayOfMonth, now);
  await prisma.recurringJournal.update({
    where: { id: rj.id },
    data: { lastRunDate: now, nextRunDate: next, runCount: { increment: 1 } },
  });

  return NextResponse.json({ entry, nextRunDate: next });
}

function computeNextRun(frequency: string, dayOfMonth: number | null, from: Date): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'daily':     d.setDate(d.getDate() + 1); break;
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  if (dayOfMonth && ['monthly', 'quarterly', 'yearly'].includes(frequency)) {
    d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  }
  return d;
}
