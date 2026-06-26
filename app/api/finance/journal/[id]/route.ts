export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { postJournal, reverseJournal, AccountingError } from '@/lib/accounting/engine';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entry = await prisma.journalEntry.findUnique({
      where: { id: params.id },
      include: {
        lines: {
          include: { account: { select: { id: true, code: true, name: true, accountType: true } } },
          orderBy: { lineNumber: 'asc' },
        },
        period: { select: { name: true, startDate: true, endDate: true } },
      },
    });

    if (!entry || entry.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { action, reversalDate, reversalReason, description, reference, notes } = body;

    if (action === 'post') {
      const entry = await postJournal(params.id, tenantId, session.user.id);
      return NextResponse.json({ entry });
    }

    if (action === 'reverse') {
      if (!reversalDate) return NextResponse.json({ error: 'reversalDate is required' }, { status: 400 });
      const entry = await reverseJournal(
        params.id, tenantId, new Date(reversalDate),
        reversalReason ?? 'Manual reversal', session.user.id
      );
      return NextResponse.json({ entry });
    }

    // Default: update draft fields
    const existing = await prisma.journalEntry.findUnique({ where: { id: params.id } });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status === 'POSTED') {
      return NextResponse.json({ error: 'Posted entries cannot be edited; use reversal instead' }, { status: 409 });
    }

    const updated = await prisma.journalEntry.update({
      where: { id: params.id },
      data: {
        description: description ?? existing.description,
        reference: reference ?? existing.reference,
        notes: notes ?? existing.notes,
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (e: any) {
    if (e instanceof AccountingError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entry = await prisma.journalEntry.findUnique({ where: { id: params.id } });
    if (!entry || entry.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (entry.status !== 'DRAFT' && entry.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Only DRAFT entries can be deleted' }, { status: 409 });
    }

    await prisma.journalEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Journal entry deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
